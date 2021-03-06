const Loki = require('lokijs')
const crypto = require('crypto')

let musicDB = null
let usersDB = null

const db = new Loki('data/local.db', {
  autoload: true,
  autosave: true,
  autoloadCallback: () => {
    musicDB = db.getCollection('music')
    if (musicDB === null) { musicDB = db.addCollection('music', { unique: ['info.location'], indices: ['albumartist', 'album'] }) }
    usersDB = db.getCollection('users')
    if (usersDB === null) { usersDB = db.addCollection('users', { unique: ['user'] }) }
  }
})

const raw = {
  songs: () => {
    return musicDB.find()
  },
  removeSong: (song) => {
    musicDB.remove(song)
  }
}

const get = {
  /*
  stats: (uuid) => {
    return new Promise(function (resolve, reject) {
      const ret = { songs: 0, albums: 0, artists: 0 }
      const allSongs = musicDB.find({ uuids: { $contains: [uuid] } })
      ret.songs = allSongs.length
      ret.artists = [...new Set(allSongs.map(song => song.info.albumartist))].length
      ret.albums = [...new Set(allSongs.map(song => song.info.album))].length
      resolve(ret)
    })
  },
  */
  all: (uuid, offset, limit) => {
    const allSongs = musicDB.chain().find({ uuid: uuid }).offset(offset).limit(limit).data()
    return { data: allSongs }
  },
  url: (uuid, id) => {
    return new Promise(function (resolve, reject) {
      const data = musicDB.get(id)
      // check this song is in your library
      if (data.uuid === uuid) {
        // yep, let's send it
        resolve(data)
      }
      // otherwise this ID isn't in your database (how did you get here?!)
      resolve({})
    })
  } // ,
  /*
  artists: (uuid) => {
    return new Promise(function (resolve, reject) {
      const songs = musicDB.chain().find({ uuids: { $contains: [uuid] } }).map(e => { return { artist: e.info.albumartist } }).simplesort('artist').data()
      const artists = [...new Set(songs.map(song => song.artist))]
      resolve(artists)
    })
  },
  artistAlbums: (uuid, artist) => {
    const promise = new Promise(function (resolve, reject) {
      const songs = musicDB.chain().find({ uuids: { $contains: [uuid] }, 'info.albumartist': artist }).map(e => { return { album: e.info.album, albumartist: e.info.albumartist, year: e.info.year, art: e.info.art } }).simplesort('album').data()
      const albums = songs.filter((tag, index, array) => array.findIndex(t => t.album === tag.album) === index).sort((a, b) => { return a.year - b.year })
      albums.forEach(e => { delete (e.meta); delete (e.$loki) })
      resolve(albums)
    })
    return promise
  },
  album: (uuid, artist, album) => {
    return new Promise(function (resolve, reject) {
      const data = musicDB.find({ uuids: { $contains: [uuid] }, 'info.albumartist': artist, 'info.album': album })
      const info = data.map(s => { s.info._id = s.$loki; return s.info }).sort((a, b) => { return a.track - b.track }).sort((a, b) => { return a.disc - b.disc })
      resolve(info)
    })
  },
  albums: (uuid) => {
    return new Promise(function (resolve, reject) {
      const songs = musicDB.chain().find({ uuids: { $contains: [uuid] } }).map(e => { return { album: e.info.album, albumartist: e.info.albumartist, artistart: e.info.art.artist } }).simplesort('album').data()
      const albums = songs.filter((tag, index, array) => array.findIndex(t => t.album === tag.album && t.albumartist === tag.albumartist) === index)
      albums.forEach(e => { delete (e.meta); delete (e.$loki) })
      resolve(albums)
    })
  },
  genres: (uuid) => {
    return new Promise(function (resolve, reject) {
      const songs = musicDB.chain().find({ uuids: { $contains: [uuid] } }).map(e => { return { genre: e.info.genre } }).simplesort('genre').data()
      const genres = [...new Set(songs.map(song => song.genre))]
      genres.forEach(e => { delete (e.meta); delete (e.$loki) })
      resolve(genres)
    })
  },
  genre: (uuid, genre) => {
    return new Promise(function (resolve, reject) {
      const songs = musicDB.chain().find({ uuids: { $contains: [uuid] }, 'info.info': genre }).map(e => { return { album: e.info.album, albumartist: e.info.albumartist } }).simplesort('album').data()
      const albums = songs.filter((tag, index, array) => array.findIndex(t => t.album === tag.album && t.albumartist === tag.albumartist) === index)
      albums.forEach(e => { delete (e.meta); delete (e.$loki) })
      resolve(albums)
    })
  }
  */
}

const add = {
  song: (info, uuid) => {
    return new Promise(function (resolve, reject) {
      const song = musicDB.findOne({ 'info.location': info.location, uuid: uuid })
      if (song === null) {
        // add the song with our UUID attached
        const newSong = { uuid: uuid, info: info, favorite: false, playCount: false }
        musicDB.insert(newSong)
      } else {
        // song exists, let's update the metadata and add ourselves to the list of uuids
        song.info = info
        musicDB.update(song)
      }
      resolve()
      const songs = musicDB.find({ 'info.location': info.location, uuid: { $ne: uuid } })
      songs.forEach(s => {
        s.info = info
        musicDB.update(s)
      })
    })
  }
}

const settings = {
  locations: function (uuid) {
    const user = usersDB.findOne({ $loki: uuid })
    return user.locations
  },
  addLocation: function (uuid, location) {
    return new Promise(function (resolve, reject) {
      const user = usersDB.findOne({ $loki: uuid })
      user.locations.push(location)
      usersDB.update(user)
      resolve(user.locations)
    })
  },
  removeLocation: function (uuid, location) {
    return new Promise(function (resolve, reject) {
      const user = usersDB.findOne({ $loki: uuid })
      user.locations = user.locations.filter(function (v, i, arr) { return v !== location })
      usersDB.update(user)
      resolve(user.locations)
    })
  }
}

const users = {
  check: function () {
    return usersDB.count()
  },
  welcome: function (username, password) {
    return new Promise(function (resolve, reject) {
      if (usersDB.count({ user: 'admin' }) > 0) {
        reject(new Error('already set'))
      }
      const account = {
        user: username,
        pass: crypto.createHash('sha256').update(password).digest('hex'),
        admin: true,
        locations: []
      }
      usersDB.insert(account)
      resolve({ status: true })
    })
  },
  getUUID: function (username, password) {
    return new Promise(function (resolve, reject) {
      const user = usersDB.findOne({ user: username })
      if (user !== null) {
        const hash = crypto.createHash('sha256').update(password).digest('hex')
        if (user.pass === hash) {
          resolve({ uuid: user.$loki, admin: user.admin })
        }
        reject(new Error('incorrect password'))
      }
      reject(new Error('not found'))
    })
  },
  getAdmin: function (uuid) {
    const user = usersDB.get(uuid)
    return user.admin
  },
  getAll: function (uuid) {
    const user = usersDB.get(uuid)
    let users = []
    if (user.admin === true) {
      users = usersDB.find()
      users = users.map(e => { return { user: e.user, uuid: e.$loki, admin: e.admin } })
    }
    return users
  },
  add: function (uuid, newUser) {
    const user = usersDB.get(uuid)
    if (user.admin === true) {
      const account = {
        user: newUser.user,
        pass: crypto.createHash('sha256').update(newUser.pass).digest('hex'),
        admin: newUser.admin,
        locations: ((newUser.inherit === true) ? user.locations : [])
      }
      const acc = usersDB.insert(account)
      if (newUser.inherit === true) {
        // here we need to find all files that are associated with uuid and add the new user
        musicDB.chain().find({ uuids: { $contains: [uuid] } }).update(function (obj) {
          obj.uuids.push(acc.$loki)
        })
      }
    }
    return users.getAll(uuid)
  },
  remove: function (uuid, userUUID) {
    const user = usersDB.get(uuid)
    if (user.admin === true) {
      const userDel = usersDB.get(userUUID)
      if (userDel.user !== 'admin') {
        usersDB.remove(userDel)
      }
    }
    return users.getAll(uuid)
  }
}

module.exports = {
  getMusic: get,
  addMusic: add,
  settings: settings,
  users: users,
  raw: raw
}
