const Loki = require('lokijs')

const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: "./data/falk.sql"
  }
})

knex.schema.createTable('tracks', function (table) {
  table.increments('id')
  table.string('path').unique()
  table.string('type')
  table.string('disc')
  table.string('track')
  table.string('title')
  table.string('album')
  table.string('artist')
  table.string('albumartist')
  table.string('genre')
  table.integer('year')
  table.integer('duration')
  table.boolean('lossless')
  table.float('samplerate')
  table.integer('bits')
  table.integer('channels')
  table.string('codec')
  table.string('artistart')
  table.string('coverart')
  table.string('discart')
  table.string('backgroundart')
  table.integer('playcount')
  table.integer('lastplayed')
  table.integer('added')
  table.boolean('favorite')
})
.then(() => {
  console.log('[DB] Creating new library')
})
.catch(e => {
  console.log(e)
  console.log('[DB] Opening existing lirary')
})

knex.schema.createTable('paths', function (table) {
  table.string('path').primary()
}).catch(e => {})

const crypto = require('crypto')
const { resolve } = require('path')
const e = require('express')
const { kStringMaxLength } = require('buffer')

let musicDB = null
let plDB = null

let db = false

function init () {
  return new Promise((resolve, reject) => {
    db = new Loki('data/falkv1.db', {
      autoload: true,
      autosave: true,
      autoloadCallback: () => {
        musicDB = db.getCollection('music')
        if (musicDB === null) {
          musicDB = db.addCollection('music', { unique: 'path', indices: ['location'] })
        }
        musicDB.on('insert', (doc) => {
          doc.id = doc.$loki
        })
        musicDB.on('delete', (doc) => {
          // check to see if other documents feature this album, delete them if they do
        })
        plDB = db.getCollection('playlists')
        if (plDB === null) {
          plDB = db.addCollection('playlists', { unique: 'name' })
        }
        resolve()
      }
    })
  })
}

const tracks = {
  add: async (info) => {
    return new Promise(async (resolve, reject) => {
      const tr = {
        path: info.path,
        type: info.type || '',
        disc: info.disc || 0,
        track: info.track || 0,
        title: info.title || 'Unknown Track',
        album: info.album || '',
        artist: info.artists[0] || 'Unknown Artist',
        albumartist: info.albumartist || 'Unkown Artist',
        genre: info.genre || 'Unknown',
        year: info.year || 0,
        duration: info.duration || 0,
        lossless: info.format.lossless,
        samplerate: info.format.samplerate || 0,
        bits: info.format.bits || 0,
        channels: info.format.channels || 0,
        codec: info.format.codec || '',
        artistart: info.art.artist || '',
        coverart: info.art.cover || '',
        discart: info.art.disc || '',
        playcount: 0,
        lastplayed: 0,
        added: Date.now(),
        favorite: false
      }
      knex('tracks').insert(tr)
        .then(() => {
          resolve()
        })
        .catch(err => {
          console.log("[DB] Filepath exists, updating...")
          // await tracks.update(info)
          resolve()
        })
    })
  },
  removeByPath: (path) => {
    return new Promise((resolve, reject) => {
    knex('tracks').where('path', '=', path).delete()
      .then(r => resolve())
    })
  },
  trackByPath: (path) => {
    return new Promise((resolve, reject) => {
      knex.from('tracks').select('*').where('path', path)
        .then(rows => resolve((rows.length > 0) ? rows[0] : false))
        .catch(err => {
          console.log(err)
          resolve(false)
        })
    })
  },
  trackExists: (path) => {
    return new Promise((resolve, reject) => {
      knex.from('tracks').select('id').where('path', path)
        .then(rows => resolve(rows.length > 0))
    })
  },
  getPath: (id) => {
    return new Promise((resolve, reject) => {
      knex.from('tracks').select('path').where('id', id)
        .then(rows => resolve(((rows.length > 0) ? rows[0].path : '')))
    })
  },
  getAllPaths: () => {
    return new Promise((resolve, reject) => {
      knex.from('tracks').select('path')
        .then(rows => resolve(rows.map(r => r.path)))
    })
  },
  incrementPlay: (path) => {
    return new Promise((resolve, reject) => {
      knex.from('tracks').where('path', path).increment('playcount', 1)
        .then(r => resolve())
    })
  }
}

const library = {
  stats: function () {
    return new Promise(async (resolve, reject) => {
      const artists = await knex('tracks').countDistinct('artist')
      const albums = await knex('tracks').countDistinct('album')
      const tracks = await knex('tracks').count()
      resolve({
        songs: tracks[0]['count(*)'],
        artists: artists[0]['count(distinct `artist`)'],
        albums: albums[0]['count(distinct `album`)']
      })
    })
  },
  artists: function () {
    return new Promise((resolve, reject) => {
      knex.from('tracks').select('artistart as art').distinct('albumartist as name').orderBy([{ column: 'name' }])
        .then(rows => resolve(rows))
        .catch(err => {
          console.log(err)
          resolve([])
        })
    })
  },
  artist: function (artistName) {
    return new Promise((resolve, reject) => {
      knex.from('tracks').select('album as name', 'year', 'artistart', 'backgroundart', 'coverart').where('albumartist', '=', artistName).groupBy('album').orderBy([{ column: 'name' }, { column: 'album' }])
      .then((rows) => {
        let background = '',  
            artistart = '',
            albums = []
        for (row of rows) {
          if (background === '' && row['backgroundart'] !== null) background = row['backgroundart']
          if (artistart === '' && row['artistart'] !== null) artistart = row['artistart']
          albums.push({
            name: row['name'],
            year: row['year'],
            art: row['coverart']
          })
        }
        resolve({
          artist: artistName,
          background,
          artistart,
          albums
        })
      })
      .catch(err => console.log(err))
   })
  },
  albums: function () {
    return new Promise((resolve, reject) => {
      knex.from('tracks').select('album as name', 'albumartist as artist', 'coverart as art').groupBy('album').orderBy('name')
        .then((rows) => {
          resolve(rows)
        })
        .catch(err => console.log(err))
    })
  },
  album: function (artist, album) {
    return new Promise((resolve, reject) => {
      knex.from('tracks').select('*').where('artist', artist).andWhere('album', album).orderBy('disc', 'track')
        .then((rows) => {
          rows.map(r => {
            r.shortformat = (r.samplerate / 1000) + 'kHz ' + ((r.bits) ? r.bits + 'bit' : '')
            r.shortestformat = (r.samplerate / 1000) + '/' + ((r.bits) ? r.bits : '')
            return r
          })
          resolve({
            title: rows[0].album,
            art: rows[0].coverart,
            artist: rows[0].albumartist,
            year: rows[0].year,
            genre: rows[0].genre,
            shortformat: rows[0].shortformat,
            shortestformat: rows[0].shortestformat,
            tracks: rows
          })
        })
        .catch(err => console.log(err))
    })
  },
  genres: function () {
    return new Promise((resolve, reject) => {
      knex.from('tracks').select('genre as name', 'coverart as art').groupBy('name').orderBy('name')
      .then((rows) => {
        resolve(rows)
      })
      .catch(err => console.log(err))
    })
  },
  genre: function (genre) {
    return new Promise((resolve, reject) => {
      knex.from('tracks').select('album as name', 'albumartist as artist', 'coverart as art').where('genre', '=', genre).groupBy('album').orderBy('name')
        .then((rows) => {
          resolve(rows)
        })
        .catch(err => console.log(err))
    })
  },
  popular: function () {
    return new Promise((resolve, reject) => {
      const songs = musicDB.chain().find().simplesort('meta.playCount', true).limit(100).data()
      const tracks = songs.map(s => {
        const i = s.info
        return {
          id: s.$loki,
          track: i.track,
          title: i.title,
          album: i.album,
          albumartist: i.albumartist,
          artist: ((i.artists.length > 0) ? i.artists[0] : i.albumartist),
          duration: i.duration,
          genre: i.genre,
          year: i.year,
          disc: i.disc,
          format: i.format,
          shortformat: (i.format.samplerate / 1000) + 'kHz ' + ((i.format.bits) ? i.format.bits + 'bit' : ''),
          shortestformat: (i.info.format.samplerate / 1000) + '/' + ((i.info.format.bits) ? i.info.format.bits : ''),
          art: {
            cover: ((i.art.cover !== '') ? i.art.cover : '')
          },
          count: s.meta.playCount
        }
      })

      resolve({
        id: 'mostplayed',
        title: 'Most Played',
        art: tracks.length > 0 ? tracks[0].art.cover : '',
        playtime: tracks.reduce((p, c) => p.duration + c.duration),
        tracks: tracks
      })
    })
  }
}

const playlists = {
  add: function (name, tracks) {
    try {
      const x = plDB.insert({
        name: name,
        tracks: tracks,
        added: Date.now(),
      })
      return x.$loki
    } catch (e) {
      console.log(e)
    }
    return null
  },
  list: function () {
    let playlists = plDB.find().map(e => {
      let s = false
      if (e.tracks.length > 0) {
        s = musicDB.get(e.tracks[0])
      }
      return {
        id: e.$loki,
        title: e.name,
        art: s ? s.info.art.cover : '',
        subtitle: e.tracks.length + ' track' + ((e.tracks.length === 1) ? '' : 's'),
      }
    })
    return playlists
  },
  get: function (id) {
    const pl = plDB.get(id)
    if (pl) {
      let tracks = pl.tracks.map(e => {
        s = musicDB.get(e)
        let info = JSON.parse(JSON.stringify(s.info))
        info.id = s.$loki
        info.shortformat = (s.info.format.samplerate / 1000) + 'kHz ' + ((s.info.format.bits) ? s.info.format.bits + 'bit' : '')
        info.shortestformat = (s.info.format.samplerate / 1000) + '/' + ((s.info.format.bits) ? s.info.format.bits : '')
        info.artist = ((s.info.artists.length > 0) ? s.info.artists[0] : s.info.albumartist)
        info.art.cover = ((s.info.art.cover !== '') ? s.info.art.cover : '')
        return info
      })
      return {
        id: pl.$loki,
        title: pl.name,
        art: tracks.length > 0 ? tracks[0].art.cover : '',
        playtime: tracks.map(e => e.duration).reduce((c, n) => c + n),
        tracks: tracks
      }
    }
    return null
  },
  remove: function (id) {
    plDB.chain()
      .get(id)
      .remove()
  },
  addTracks: function (id, tracks) {
    let pl = plDB.get(id)
    if (pl) {
      tracks.forEach(tr => {
        pl.tracks.push(tr)
      })
      plDB.update(pl)
      return true
    }
    return false
  },
  removeTracks: function (id, indices) {
    let pl = plDB.get(id)
    let removed = 0;
    for(let i = 0; i < indices.length; i++)
      if (pl.tracks.splice(indices[i], 1))
        removed++
    plDB.update(pl)
    if (removed > 0)
      return true
    return false
  },
  moveTrack: function (id, oldPos, newPos) {

  }
}

const locations = {
  add: function (path) {
    return new Promise((resolve, reject) => {
      knex('paths').insert({ path })
      .then(() => 
        console.log('[DB] Path added (' + path + ')')
      )
      .catch(err => {
        console.log(err)
      })
    })
  },
  remove: function (path) {
    return new Promise(async (resolve, reject) => {
      // find and remove the location
      await knex('paths').where('path', '=', path).delete()

      // remove any associated tracks
      await knex('tracks').where('path', 'like', path + '%').delete()

      // return the all paths
      resolve(await locations.paths())
    })
  },
  paths: function () {
    return new Promise((resolve, reject) => {
      knex.from('paths').select('*').orderBy('path')
      .then((rows) => {
        resolve(rows.map(r => r.path))
      })
      .catch(err => console.log(err))
    })
  }
}

module.exports = {
  init,
  tracks,
  locations,
  library,
  playlists
}
