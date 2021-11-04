const Walk = require('@root/walk')
const fs = require('fs')
const path = require('path')
const mm = require('music-metadata')
const crypto = require('crypto')

const util = require('util');
const exec = util.promisify(require('child_process').exec)

const database = require('./database')

let totalFiles = 0,
    filesScanned = 0

async function processFile(ffname, { overwrite } = {}) {
  return mm.parseFile(ffname)
    .then(async meta => {
      const song = {
        path: ffname,
        type: ffname.substr(ffname.lastIndexOf('.') + 1),
        title: meta.common.title,
        album: meta.common.album,
        albumartist: (('albumartist' in meta.common) ? meta.common.albumartist : meta.common.artist),
        artists: meta.common.artists,
        duration: Math.round(meta.format.duration),
        genre: (('genre' in meta.common) ? meta.common.genre[0] : ''),
        year: meta.common.year,
        track: meta.common.track.no,
        disc: meta.common.disk.no || 1,
        format: {
          lossless: meta.format.lossless,
          samplerate: meta.format.sampleRate,
          channels: meta.format.numberOfChannels,
          bits: meta.format.bitsPerSample,
          codec: meta.format.codec
        },
        art: {
          artist: '',
          cover: '',
          disc: '',
          background: ''
        }
      }
  
      if (meta.common.picture !== undefined) {
        meta.common.picture.forEach(pic => {
          let fn = null
          let ext = null
  
          if (pic.format === 'image/jpeg') {
            ext = 'jpg'
          } else if (pic.format === 'image/png') {
            ext = 'png'
          }
  
          switch (pic.type) {
            case 'Cover (front)':
              fn = crypto.createHash('sha1').update(song.album + song.albumartist).digest('hex') + '-cover.' + ext
              song.art.cover = '/art/' + fn
              break
            case 'Media (e.g. label side of CD)':
              fn = crypto.createHash('sha1').update(song.album + song.albumartist).digest('hex') + '-disc.' + ext
              song.art.disc = '/art/' + fn
              break
            case 'Artist/performer':
              fn = crypto.createHash('sha1').update(song.albumartist).digest('hex') + '.' + ext
              song.art.artist = '/art/' + fn
              break
            case 'Illustration':
              fn = crypto.createHash('sha1').update(song.albumartist).digest('hex') + '-bg.' + ext
              song.art.background = '/art/' + fn
              break
          }
          fn = path.resolve(__dirname, '../art/' + fn)
          if (ext !== null && fn !== null && !fs.existsSync(fn)) {
            fs.writeFile(fn, pic.data, (err) => {
              if (err) return console.error(err)
            })
          }
          if (ext === null) {
            console.log('[SCAN][Pic] Unsupported filetype: "' + pic.filetype + '"')
          }
        })
      }
  
      if (overwrite) {
        await database.tracks.update(song)
        console.log(`[SCAN][Updated] :: ${song.title} [${ffname}]`)
      } else {
        await database.tracks.add(song)
        console.log(`[SCAN][Added] :: ${song.title} [${ffname}]`)
      }
    })
}

async function walkFunc (err, pathname, dirent) {
  if (err) {
    console.warn('fs stat error for %s: %s', pathname, err.message)
    return Promise.resolve()
  }


  // skip directories
  if (dirent.isDirectory() || dirent.isSymbolicLink()) {
    return Promise.resolve()
  }

  const allowedExt = ['mp3', 'flac', 'wav', 'ogg']
  const ext = dirent.name.substr(dirent.name.lastIndexOf('.') + 1)
  if (!allowedExt.includes(ext)) {
    return Promise.resolve()
  }

  // we should report this now, allows to track all files processed (even those skipped)
  // this is important as the number of files to be scanned includes *all* files
  filesScanned++
  sendEvent({ toScan: totalFiles, scanned: filesScanned }, { event: 'scanner' })

  // check here to see if file exists in database
  if (await database.tracks.trackExists(path.dirname(pathname) + '/' + dirent.name)) {
    return Promise.resolve()
  }
  await processFile(path.dirname(pathname) + '/' + dirent.name)
}

function getHome () {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']
}

async function getDirs (dir) {
  dir = dir || getHome()
  const promise = new Promise(function (resolve, reject) {
    fs.readdir(dir, { withFileTypes: true }, (err, files) => {
      if (!err) {
        const out = []
        if (dir !== '/') {
          out.push({ name: '..' })
        }
        files.forEach((file) => {
          if (file.isDirectory() && !file.name.startsWith('.')) {
            out.push({ name: file.name })
          }
        })
        resolve({ location: dir, directories: out })
      }
    })
  })
  return promise
}

async function scan (dir) {
  console.log('Starting scan')

  sendEvent({ status: 'started' }, { event: 'scanner' })

  const allSongs = await database.tracks.getAllPaths()
  allSongs.forEach(async track => {
    if (!fs.existsSync(track)) {
      console.log('[SCAN][Remove] ::', track)
      await database.tracks.removeByPath(track)
    }
  })

  const dirs = dir || await database.locations.paths()
  totalFiles = 0
  for (let i = 0; i < dirs.length; i++) {
    const { stdout, stderr } = await exec(`find ${dirs[i]} f \\( -name "*.mp3" -o -name "*.flac" -o -name "*.wav" -o -name "*.ogg" \\)|wc -l`)
    totalFiles += parseInt(stdout)
  }

  sendEvent({ toScan: totalFiles, scanned: 0 }, { event: 'scanner' })

  for (let i = 0; i < dirs.length; i++) {
    console.log('Scanning', dirs[i])
    try {
      await Walk.walk(dirs[i], walkFunc)
    } catch (e) {
      console.log(e)
    }
  }
  console.log('Scan complete')

  sendEvent({ status: 'stopped' }, { event: 'scanner' })
  totalFiles = 0
  filesScanned = 0
}

const chokidar = require('chokidar')
const wOptions = { ignoreInitial: true, awaitWriteFinish: true }
let watcher = false
async function watch(database) {
  //console.log(sendEvent)
  const dirs = await database.locations.paths()
  //console.log('[SCAN][Watch] :: ', dirs)
  watcher = chokidar.watch(dirs, wOptions)
  watcher.on('add', async (path, stats) => {
    console.log('[WATCH][Add] :: ' + path)
    await processFile(path)
  })
  watcher.on('change', async (path) => {
    console.log('[WATCH][Change] :: ' + path)
    await processFile(path, { overwrite: true })
  })
  watcher.on('unlink', async (path) => {
    console.log('[WATCH][Remove] :: ' + path)
    await database.tracks.removeByPath(path)
  })
}
function addToWatcher(dir) {
  console.log('[WATCH][AddDir] :: ', dir)
  watcher.add(dir)
}
function delFromWatcher(dir) {
  console.log('[WATCH][RemoveDir] :: ', dir)
  watcher.unwatch(dir)
}

module.exports = {
  scan: scan,
  getDirs: getDirs,
  watch: {
    start: watch,
    add: addToWatcher,
    remove: delFromWatcher
  }
}
