const Walk = require('@root/walk')
const fs = require('fs')
const path = require('path')
const mm = require('music-metadata')
const crypto = require('crypto')

const database = require('./database')

let rescan = false
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

  const meta = await mm.parseFile(path.dirname(pathname) + '/' + dirent.name)

  const song = {
    location: path.dirname(pathname) + '/' + dirent.name,
    title: meta.common.title,
    album: meta.common.album,
    albumartist: meta.common.artist,
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
    playcount: 1,
    dateadded: Date.now(),
    favorite: false
  }

  if (meta.common.picture !== undefined) {
    const pic = meta.common.picture[0]
    let ext = 'png'
    if (pic.format === 'image/jpeg') {
      ext = 'jpg'
    }
    const _f = song.album.toLowerCase() + song.albumartist.toLowerCase()
    const fn = 'art/' + crypto.createHash('sha1').update(_f).digest('hex') + '.' + ext
    if (!fs.existsSync(fn)) {
      fs.writeFile(fn, pic.data, (err) => {
        if (err) return console.error(err)
        console.log('art saved to ', fn)
      })
    } else {
      console.log('skipping art: exists')
    }
  }

  database.addMusic.song(song, rescan, uuid)
    .then(() => {
      return Promise.resolve()
    })
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

function scan (doRescan, newuuid) {
  rescan = doRescan || false
  uuid = newuuid
  const promise = new Promise(function (resolve, reject) {
    database.settings.getDirs(uuid)
      .then(data => {
        data.forEach(dir => {
          Walk.walk(dir, walkFunc)
            .then(() => {})
        })
        resolve()
      })
  })
  return promise
}

module.exports = {
  scan: scan,
  getDirs: getDirs
}
