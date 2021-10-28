const Loki = require('lokijs')

const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: "./data/falk.sql"
  }
})

knex.schema.createTable('tracks', function (table) {
  table.string('path').primary()
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
  table.integer('playcount').defaultTo(0)
  table.integer('lastplayed').defaultTo(0)
  table.integer('added').defaultTo(Date.now())
  table.boolean('favorite').defaultTo(false)
})
.then(() => {
  console.log('[DB] Creating new library')
})
.catch(e => {
  console.log('[DB] Opening existing lirary')
  /*
  knex.from('tracks').select('albumartist as name', 'album', 'year', 'artistart', 'backgroundart', 'coverart').groupBy('album').orderBy([{ column: 'name' }, { column: 'album' }])
  .then((rows) => {
    let albums = {}
    for (row of rows) {
      console.log(row);
      let artist = row['name']
      if (!Object.keys(artists).includes(artist)) {
        artists[artist] = []
      }
      artists[artist].push({
        name: row['album'],
        art: row['art']
      })
    }
    console.log(artists)
  })
  .catch(err => console.log(err))
  */
})

const crypto = require('crypto')
const { resolve } = require('path')
const e = require('express')
const { kStringMaxLength } = require('buffer')

let musicDB = null
let locDB = null
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
        locDB = db.getCollection('locations')
        if (locDB === null) {
          locDB = db.addCollection('locations', { unique: 'path' })
        }
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
    const tr = {
      path: info.path,
      type: info.type,
      disc: info.disc,
      track: info.track,
      title: info.title,
      album: info.album,
      artist: info.artists[0],
      albumartist: info.albumartist,
      genre: info.genre,
      year: info.year,
      duration: info.duration,
      lossless: info.format.lossless,
      samplerate: info.format.samplerate,
      bits: info.format.bits,
      channels: info.format.channels,
      codec: info.format.codec,
      artistart: info.art.artist,
      coverart: info.art.cover,
      discart: info.art.disc
    }
    knex('tracks').insert(tr)
      .onConflict('path')
      .merge()
      .then(() => 
        console.log("[DB] Data inserted")
      )
      .catch(err => {
        console.log(err)
      })
  },
  removeByPath: (path) => {
    knex('tracks').where('path', '=', path).delete()
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
      knex.from('tracks').select('1').where('path', path)
        .then(rows => resolve(rows.length > 0))
    })
  },
  getAll: (offset = 0, limit = 0) => {
    const allSongs = musicDB.chain()
      .find()
      .offset(offset)
      .limit(limit)
      .map(doc => { return {
        info: doc.info,
        added: doc.added,
        id: doc.id,
        md: doc.meta
      } })
      .data({ removeMeta: true })
    return allSongs
  },
  getPath: (id) => {
    const track = musicDB.get(parseInt(id))
    if (track) {
      return track.path
    } else {
      return null
    }
  },
  getAllPaths: () => {
    return musicDB.chain()
      .find()
      .map(e => { return { path: e.path } })
      .data({ removeMeta: true })
  },
  incrementPlay: (path) => {
    const track = musicDB.findOne({ path: path })
    if (track) {
      track.meta.playCount++
      musicDB.update(track)
    }
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
      const data = musicDB.chain().find({ 'info.albumartist': artist, 'info.album': album }).compoundsort(['info.disc', 'info.track']).data()
      const info = data.map(s => {
        let info = JSON.parse(JSON.stringify(s.info))
        info.id = s.$loki
        info.shortformat = (s.info.format.samplerate / 1000) + 'kHz ' + ((s.info.format.bits) ? s.info.format.bits + 'bit' : '')
        info.shortestformat = (s.info.format.samplerate / 1000) + '/' + ((s.info.format.bits) ? s.info.format.bits : '')
        info.artist = ((s.info.artists.length > 0) ? s.info.artists[0] : s.info.albumartist)
        info.art.cover = ((s.info.art.cover !== '') ? s.info.art.cover : '')
        return info
      })
      resolve({
        title: info[0].album,
        art: info[0].art.cover,
        artist: info[0].albumartist,
        year: info[0].year,
        genre: info[0].genre,
        shortformat: info[0].shortformat,
        shortestformat: info[0].shortestformat,
        tracks: info
      })
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
  mappings: function () {
    return locDB.chain()
      .find()
      .data({ removeMeta: true })
  },
  add: function (path) {
    locDB.insert({ path: path })
    return locations.mappings()
  },
  remove: function (path) {
    // find and remove the location
    locDB.remove(locDB.by('path', path))

    // remove any associated tracks
    musicDB.chain().where(doc => doc.path.startsWith(path)).remove()

    // return the new mappings
    return locations.mappings()
  },
  paths: function () {
    return locDB.find().map(e => e.path)
  }
}

module.exports = {
  init,
  tracks,
  locations,
  library,
  playlists
}
