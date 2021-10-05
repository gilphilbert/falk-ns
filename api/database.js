const Loki = require('lokijs')
const crypto = require('crypto')
const { resolve } = require('path')
const e = require('express')

let musicDB = null
let usersDB = null
let locDB = null

let db = false

function init (callBack = null) {
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
      usersDB = db.getCollection('users')
      if (usersDB === null) {
        usersDB = db.addCollection('users', { unique: ['user'] })
      }
      locDB = db.getCollection('locations')
      if (locDB === null) {
        locDB = db.addCollection('locations', { unique: 'path' })
      }
      plDB = db.getCollection('playlists')
      if (plDB === null) {
        plDB = db.addCollection('playlists', { unique: 'name' })
      }

      if (callBack != null) {
        callBack()
      }

      //users.welcome('admin', 'password')
      //locations.add(1, '/home/phill/Music', [1])

      // console.log(tracks.getPath(1, 13))
      // users.add(1, { user: 'phill', pass: 'password', admin: true })
      // locations.setUsers(1, '/home/phill/Music', [1, 2])
      // locations.remove(1, '/home/phill/Music')
      // tracks.add({ path: '/home/phill/Music/test1.flac', artist:'Bob', title:'This' })
      // tracks.add({ path: '/home/phill/Music/test2.flac', artist:'Bob', title:'That' })
      // console.log(tracks.getAll(1, 0, 4000))
      // console.log(tracks.getAllPaths())
    }
  })
}

const tracks = {
  add: (info) => {
    try {
      musicDB.insert({
        info: info,
        path: info.path,
        meta: { playCount: 0, favorite: false, lastPlayed: false },
        added: Date.now(),
      })
    } catch {
      tracks.update(info)
    }
  },
  update: (info) => {
    musicDB.chain()
      .find({ path: info.path })
      .update((doc) => doc.info = info)
  },
  removeByPath: (path) => {
    musicDB.chain()
      .find({ path: path })
      .remove()
  },
  trackByPath: (path) => {
    const track = musicDB.findOne({ path: path })
    return track
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
    return new Promise((resolve, reject) => {
      const ret = { songs: 0, albums: 0, artists: 0 }
      const allSongs = musicDB.find()
      ret.songs = allSongs.length
      ret.artists = [...new Set(allSongs.map(song => song.info.albumartist))].length
      ret.albums = [...new Set(allSongs.map(song => song.info.album))].length
      resolve(ret)
    })
  },
  artists: function () {
    return new Promise((resolve, reject) => {
      const artists = musicDB.chain().find().compoundsort([['info.artist.art', true], 'info.albumartist']).data()
      resolve(artists
        .filter((tag, index, array) => array.findIndex(t => t.info.albumartist === tag.info.albumartist) === index)
        .map(a => { return { title: a.info.albumartist, art: ((a.info.art.artist !== '') ? '/art/' + a.info.art.artist : ''), subtitle: '' } })
      )
    })
  },
  artist: function (artist) {
    return new Promise((resolve, reject) => {
      const artistArt = musicDB.chain().find({ 'info.albumartist': artist }).compoundsort([['info.artist.art', true], 'info.albumartist']).limit(1).data()[0].info.art.artist
      const songs = musicDB.chain().find({ 'info.albumartist': artist }).simplesort('info.year').data()
      const albums = songs.map(e => {
        return {
          art: ((e.info.art.cover !== '') ? '/art/' + e.info.art.cover : ''),
          artistart: ((artistArt !== '') ? '/art/' + artistArt : ''),
          background: ((e.info.art.background !== '') ? '/art/' + e.info.art.background : ''),
          title: e.info.album,
          subtitle: e.info.year,
        }
      }).filter((tag, index, array) => array.findIndex(t => t.title === tag.title && t.subtitle === tag.subtitle) === index)
      resolve({ albums: albums })
    })
  },
  albums: function () {
    return new Promise((resolve, reject) => {
      const songs = musicDB.chain().find().simplesort('info.album').data()
      const albums = songs.map(e => {
        return {
          art: ((e.info.art.cover !== '') ? '/art/' + e.info.art.cover : ''),
          title: e.info.album,
          subtitle: e.info.albumartist,
        }
      }).filter((tag, index, array) => array.findIndex(t => t.title === tag.title && t.subtitle === tag.subtitle) === index)
      resolve(albums)
    })
  },
  album: function (artist, album) {
    return new Promise((resolve, reject) => {
      const data = musicDB.chain().find({ 'info.albumartist': artist, 'info.album': album }).compoundsort(['info.disc', 'info.track']).data()
      const info = data.map(s => {
        s.info.id = s.$loki
        s.info.shortformat = (s.info.format.samplerate / 1000) + 'kHz ' + ((s.info.format.bits) ? s.info.format.bits + 'bit' : '')
        s.info.shortestformat = (s.info.format.samplerate / 1000) + '/' + ((s.info.format.bits) ? s.info.format.bits : '')
        s.info.artist = ((s.info.artists.length > 0) ? s.info.artists[0] : s.info.albumartist)
        s.info.art.cover = ((s.info.art.cover !== '') ? '/art/' + s.info.art.cover : '')
        return s.info
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
      const songs = musicDB.chain().find().simplesort('info.genre').data()
      const genres = songs.map(e => {
        return {
          art: ((e.info.art.cover) ? '/art/' + e.info.art.cover : ''),
          title: e.info.genre,
          subtitle: '',
        }
      }).filter((tag, index, array) => array.findIndex(t => t.title === tag.title && t.title !== '') === index)
      resolve(genres)
    })
  },
  genre: function (genre) {
    return new Promise((resolve, reject) => {
      const songs = musicDB.chain().find({ 'info.genre': genre }).simplesort('info.album').data()
      const albums = songs.map(e => {
        return {
          art: ((e.info.art.cover) ? '/art/' + e.info.art.cover : ''),
          title: e.info.album,
          subtitle: e.info.albumartist,
        }
      }).filter((tag, index, array) => array.findIndex(t => t.title === tag.title && t.subtitle === tag.subtitle) === index)
      resolve(albums)
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
            cover: ((i.art.cover !== '') ? '/art/' + i.art.cover : '')
          },
          count: s.meta.playCount
        }
      })

      resolve({
        id: 'mostplayed',
        title: 'Most Played',
        art: tracks.length > 0 ? '/art/' + tracks[0].art.cover : '',
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
        art: s ? '/art/' + s.info.art.cover : '',
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
        s.info.id = s.$loki
        s.info.shortformat = (s.info.format.samplerate / 1000) + 'kHz ' + ((s.info.format.bits) ? s.info.format.bits + 'bit' : '')
        s.info.shortestformat = (s.info.format.samplerate / 1000) + '/' + ((s.info.format.bits) ? s.info.format.bits : '')
        s.info.artist = ((s.info.artists.length > 0) ? s.info.artists[0] : s.info.albumartist)
        s.info.art.cover = ((s.info.art.cover !== '') ? '/art/' + s.info.art.cover : '')
        return s.info
      })
      return {
        id: pl.$loki,
        title: pl.name,
        art: tracks.length > 0 ? '/art/' + tracks[0].art.cover : '',
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
