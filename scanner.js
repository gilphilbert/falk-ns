var Walk = require("@root/walk");
const fs = require("fs");
var path = require("path")
const mm = require('music-metadata')

const database = require('./database')

async function walkFunc(err, pathname, dirent) {
    if (err) {  
      console.warn("fs stat error for %s: %s", pathname, err.message);
      return Promise.resolve();
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

    meta = await mm.parseFile(path.dirname(pathname) + '/' + dirent.name)

    let song = {
        location: path.dirname(pathname) + '/' + dirent.name,
        title: meta.common.title,
        album: meta.common.album,
        albumartist: meta.common.artist,
        artists: meta.common.artists,
        duration: Math.round(meta.format.duration),
        genre: meta.common.genre[0] || '',
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
        favorite: false,
    }

    database.addMusic.song(song)    

    return Promise.resolve()
}

function getHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

async function getDirs(dir) {
    dir = dir || getHome()
    const promise = new Promise(function (resolve, reject) {
        fs.readdir(dir, { withFileTypes: true }, (err, files) => {
            let out = []
            if (dir != '/') {
                out.push('..')
            }
            files.forEach((file) => {
                if(file.isDirectory() && !file.name.startsWith('.')) {
                    out.push(file.name)
                }
            })
            resolve({ location: dir, directories: out })
        })
    })
    return promise
}

function scan() {
    const promise = new Promise(function (resolve, reject) {
        const dirs = database.settings.getDirs()
        .then(data => {
            data.forEach(dir => {
                Walk.walk(dir, walkFunc)
                .then(() => {
                })    
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