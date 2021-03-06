const Walk = require('@root/walk')
const fs = require('fs')
const path = require('path')
const mm = require('music-metadata')
const crypto = require('crypto')

const database = require('./database')

let uuid = ''
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

  try {
    const meta = await mm.parseFile(path.dirname(pathname) + '/' + dirent.name)
    const song = {
      location: path.dirname(pathname) + '/' + dirent.name,
      type: dirent.name.substr(dirent.name.lastIndexOf('.') + 1),
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
        }
        fn = path.resolve(__dirname, 'art/' + fn)
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

    database.addMusic.song(song, uuid)
      .then(() => {
        return Promise.resolve()
      })
  } catch (e) {
    console.log('Metadata lookup failed for: ' + path.dirname(pathname) + '/' + dirent.name)
    console.log(e)
  }
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

async function scan (newuuid) {
  uuid = newuuid
  // const promise = new Promise(function (resolve, reject) {
  const allSongs = database.raw.songs()
  allSongs.forEach(song => {
    if (!fs.existsSync(song.info.location)) {
      database.raw.removeSong(song)
    }
  })

  const dirs = database.settings.locations(uuid)
  for (let i = 0; i < dirs.length; i++) {
    try {
      await Walk.walk(dirs[i], walkFunc)
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = {
  scan: scan,
  getDirs: getDirs
}
