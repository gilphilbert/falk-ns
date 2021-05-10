const Walk = require('@root/walk')
const fs = require('fs')
const path = require('path')
const mm = require('music-metadata')
const crypto = require('crypto')

const database = require('./database')

async function processFile(ffname) {
  return new Promise(async (resolve, reject) => {
    try {
      const meta = await mm.parseFile(ffname)
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
          disc: ''
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
              fn = crypto.createHash('sha1').update(song.album.toLowerCase() + song.albumartist.toLowerCase()).digest('hex') + '-cover.' + ext
              song.art.cover = fn
              break
            case 'Media (e.g. label side of CD)':
              fn = crypto.createHash('sha1').update(song.album.toLowerCase() + song.albumartist.toLowerCase()).digest('hex') + '-disc.' + ext
              song.art.disc = fn
              break
            case 'Artist/performer':
              fn = crypto.createHash('sha1').update(song.albumartist.toLowerCase()).digest('hex') + '.' + ext
              song.art.artist = fn
              break
            case 'Illustration':
              fn = crypto.createHash('sha1').update(song.albumartist.toLowerCase()).digest('hex') + '-bg.' + ext
              song.art.background = fn
              break
          }
          fn = path.resolve(__dirname, '../art/' + fn)
          if (ext !== null && fn !== null && !fs.existsSync(fn)) {
            fs.writeFile(fn, pic.data, (err) => {
              if (err) return console.error(err)
            })
          }
          if (ext === null) {
            console.log('[PIC] Unsupported filetype: "' + pic.filetype + '"')
          }
        })
      }
  
  
      database.tracks.add(song)
      console.log(`ADD :: ${song.title} [${ffname}]`)
      resolve()
    } catch (e) {
      console.log('Metadata lookup failed for: ' + ffname)
      console.log(e)
      resolve()
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

  const allSongs = database.tracks.getAllPaths()
  allSongs.forEach(track => {
    if (!fs.existsSync(track.path)) {
      console.log('DELETE ::', track.path)
      database.tracks.removeByPath(track.path)
    }
  })

  const dirs = dir || database.locations.paths()
  for (let i = 0; i < dirs.length; i++) {
    console.log('Scanning', dirs[i])
    try {
      await Walk.walk(dirs[i], walkFunc)
    } catch (e) {
      console.log(e)
    }
  }
  console.log('Scan complete')
}

let newFiles = false
function sendMessage(sendEvent) {
  if (newFiles) {
    newFiles = false
    sendEvent({ status: 'complete' }, { event: 'update' })
    setTimeout(() => { sendMessage(sendEvent) }, 2000)
  }
}

const chokidar = require('chokidar')
const wOptions = { ignoreInitial: true, awaitWriteFinish: true }
let watcher = false
function watch(database, sendEvent) {
  const dirs = database.locations.paths()
  console.log('WATCH :: WATCHING', dirs)
  watcher = chokidar.watch(dirs, wOptions)
  watcher.on('add', async (path, stats) => {
    await processFile(path)
    newFiles = true
    setTimeout(() => { sendMessage(sendEvent) }, 2000)
  })
  watcher.on('change', (path) => {
    processFile(path)
    newFiles = true
    setTimeout(() => { sendMessage(sendEvent) }, 2000)
  })
  watcher.on('unlink', (path) => {
    database.tracks.removeByPath(path)
    newFiles = true
    setTimeout(() => { sendMessage(sendEvent) }, 2000)
  })
}
function addToWatcher(dir) {
  console.log('WATCH :: ADDED', dir)
  watcher.add(dir)
}
function delFromWatcher(dir) {
  console.log('WATCH :: REMOVED', dir)
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
