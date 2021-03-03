const Datastore = require('nedb')
const musicDB = new Datastore({ filename: 'data/music.db', autoload: true })
const appDB = new Datastore({ filename: 'data/app.db', autoload: true })
// const playlistDB = new Datastore({ filename: 'data/playlists.db', autoload: true })

// appDB.insert({ setting: 'directories', data: ['/home/phill/Music'] })

musicDB.ensureIndex({ fieldName: 'location', unique: true }, function (err) {
// If there was an error, err is not null
  if (err) {
    console.log('skipping duplicate entry')
  }
})

const get = {
  allSongs: () => {
    const promise = new Promise(function (resolve, reject) {
      musicDB.find({}, (err, data) => {
        if (err || data.length === 0) {
          reject(err)
        }
        resolve(data)
      })
    })
    return promise
  },
  url: (id) => {
    const promise = new Promise(function (resolve, reject) {
      musicDB.find({ _id: id }, { location: 1 }, (err, data) => {
        if (err || data.length === 0) {
          reject(err)
        }
        resolve(data[0])
      })
    })
    return promise
  },
  artists: () => {
    return new Promise(function (resolve, reject) {
      musicDB.find({ }, { albumartist: 1 }, (err, data) => {
        let artists = []
        if (!err && data.length > 0) {
          artists = [...new Set(data.map(song => song.albumartist))]
          resolve(artists)
        }
        reject(err)
      })
    })
  },
  artistAlbums: (artist) => {
    const promise = new Promise(function (resolve, reject) {
      musicDB.find({ albumartist: artist }, { albumartist: 1, album: 1, year: 1, _id: 0 }, (err, data) => {
        let albums = []
        if (!err && data.length > 0) {
          albums = data.filter((tag, index, array) => array.findIndex(t => t.album === tag.album) === index)
          resolve(albums)
        }
        reject(err)
      })
    })
    return promise
  },
  album: (artist, album) => {
    const promise = new Promise(function (resolve, reject) {
      musicDB.find({ albumartist: artist, album: album }, (err, data) => {
        if (!err && data.length > 0) {
          data = data.sort((a, b) => { return a.track - b.track })
          resolve(data)
        }
        reject(err)
      })
    })
    return promise
  },
  albums: () => {
    const promise = new Promise(function (resolve, reject) {
      musicDB.find({ }, { albumartist: 1, album: 1, _id: 0 }, (err, data) => {
        let albums = []
        if (!err && data.length > 0) {
          albums = data.filter((tag, index, array) => array.findIndex(t => t.album === tag.album && t.albumartist === tag.albumartist) === index)
          resolve(albums)
        }
        reject(err)
      })
    })
    return promise
  },
  genres: () => {
    return new Promise(function (resolve, reject) {
      musicDB.find({ }, { genre: 1 }, (err, data) => {
        let genres = []
        if (!err && data.length > 0) {
          genres = [...new Set(data.map(song => song.genre[0]))]
          resolve(genres)
        }
        reject(err)
      })
    })
  }
}

const add = {
  song: (meta) => {
    musicDB.insert(meta, (err, doc) => {
      if (err) {
        console.log('Can\'t add file: probably exists')
      }
    })
  }
}

const settings = {
  getDirs: function () {
    return new Promise(function (resolve, reject) {
      appDB.find({ setting: 'directories' }, (err, data) => {
        if (!err) {
          resolve(data[0].data)
        }
      })
    })
  },
  locations: function () {
    return new Promise(function (resolve, reject) {
      appDB.find({ setting: 'directories' }, (err, data) => {
        if (!err) {
          resolve(data[0].data)
        } else {
          reject(err)
        }
      })
    })
  },
  addLocation: function (location) {
    return new Promise(function (resolve, reject) {
      appDB.update({ setting: 'directories' }, { $push: { data: location } }, (err, data) => {
        if (err) {
          console.log(err)
        }
        resolve(settings.locations())
      })
    })
  },
  removeLocation: function (location) {
    return new Promise(function (resolve, reject) {
      appDB.update({ setting: 'directories' }, { $pull: { data: location } }, (err, data) => {
        if (err) {
          console.log(err)
        }
        resolve(settings.locations())
      })
    })
  }
}

module.exports = {
  getMusic: get,
  addMusic: add,
  settings: settings
}
