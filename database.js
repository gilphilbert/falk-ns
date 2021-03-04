const Datastore = require('nedb')
const musicDB = new Datastore({ filename: 'data/music.db', autoload: true })
const appDB = new Datastore({ filename: 'data/app.db', autoload: true })
const userDB = new Datastore() // ({ filename: 'data/users.db', autoload: true })
// const playlistDB = new Datastore({ filename: 'data/playlists.db', autoload: true })

const crypto = require('crypto')

musicDB.ensureIndex({ fieldName: 'location', unique: true }, function (err) {
// If there was an error, err is not null
  if (err) {
    console.log('skipping duplicate entry')
  }
})

userDB.ensureIndex({ fieldName: 'username', unique: true }, function (err) {
  // If there was an error, err is not null
  if (err) {
    console.log('user already exists!')
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

const users = {
  check: function () {
    return new Promise(function (resolve, reject) {
      userDB.count({}, (err, data) => {
        if (err) {
          reject(err)
        }
        resolve(data)
      })
    })
  },
  welcome: function (username, password) {
    return new Promise(function (resolve, reject) {
      userDB.find({ user: 'admin' }, (err, data) => {
        if (err) {
          reject(err)
        }
        if (data.length > 0) {
          reject(new Error('already set'))
        }
        const account = {
          user: username,
          pass: crypto.createHash('sha256').update(password).digest('hex'),
          admin: true
        }
        userDB.insert(account, () => {
          resolve({ status: true })
        })
      })
    })
  },
  getUUID: function (username, password) {
    return new Promise(function (resolve, reject) {
      userDB.find({ user: username }, (err, data) => {
        if (err) {
          reject(err)
        }
        if (data.length > 0) {
          const hash = crypto.createHash('sha256').update(password).digest('hex')
          if (data[0].pass === hash) {
            resolve({ uuid: data._id })
          }
          reject(new Error('incorrect password'))
        }
        reject(new Error('not found'))
      })
    })
  }
}

module.exports = {
  getMusic: get,
  addMusic: add,
  settings: settings,
  users: users
}
