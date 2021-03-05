const Datastore = require('nedb')
const musicDB = new Datastore({ filename: 'data/music.db', autoload: true })
const userDB = new Datastore({ filename: 'data/users.db', autoload: true })
// const playlistDB = new Datastore({ filename: 'data/playlists.db', autoload: true })
// const appDB = new Datastore({ filename: 'data/app.db', autoload: true })

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
  stats: (uuid) => {
    const promise = new Promise(function (resolve, reject) {
      const ret = { songs: 0, albums: 0, artists: 0 }
      musicDB.find({ uuids: uuid }, (err, data) => {
        if (err || data === undefined || data.lenth === 0) {
          reject(err)
        }
        ret.songs = data.length
        ret.artists = [...new Set(data.map(song => song.meta.albumartist))].length
        ret.albums = [...new Set(data.map(song => song.meta.album))].length
        resolve(ret)
      })
    })
    return promise
  },
  url: (uuid, id) => {
    const promise = new Promise(function (resolve, reject) {
      musicDB.find({ uuids: uuid, _id: id }, { location: 1 }, (err, data) => {
        if (err || data.length === 0) {
          reject(err)
        }
        resolve(data[0])
      })
    })
    return promise
  },
  artists: (uuid) => {
    return new Promise(function (resolve, reject) {
      musicDB.find({ uuids: uuid }, { 'meta.albumartist': 1 }, (err, data) => {
        let artists = []
        if (!err && data.length > 0) {
          artists = [...new Set(data.map(song => song.meta.albumartist))]
          resolve(artists)
        }
        reject(err)
      })
    })
  },
  artistAlbums: (uuid, artist) => {
    const promise = new Promise(function (resolve, reject) {
      musicDB.find({ uuids: uuid, 'meta.albumartist': artist }, { 'meta.albumartist': 1, 'meta.album': 1, 'meta.year': 1 }, (err, data) => {
        let albums = []
        if (!err && data.length > 0) {
          albums = data.filter((tag, index, array) => array.findIndex(t => t.meta.album === tag.meta.album) === index)
          const metas = albums.map(s => { return s.meta })
          resolve(metas)
        }
        reject(err)
      })
    })
    return promise
  },
  album: (uuid, artist, album) => {
    const promise = new Promise(function (resolve, reject) {
      musicDB.find({ uuids: uuid, 'meta.albumartist': artist, 'meta.album': album }, (err, data) => {
        if (!err && data.length > 0) {
          const metas = data.map(s => { s.meta._id = s._id; return s.meta }).sort((a, b) => { return a.track - b.track })
          resolve(metas)
        }
        reject(err)
      })
    })
    return promise
  },
  albums: (uuid) => {
    const promise = new Promise(function (resolve, reject) {
      musicDB.find({ uuids: uuid }, { 'meta.albumartist': 1, 'meta.album': 1 }, (err, data) => {
        if (!err && data.length > 0) {
          let albums = data.map(s => { return s.meta }).filter((tag, index, array) => array.findIndex(t => t.album === tag.album && t.albumartist === tag.albumartist) === index)
          albums = albums.sort((a, b) => { return a.title - b.title })
          resolve(albums)
        }
        reject(err)
      })
    })
    return promise
  },
  genres: (uuid) => {
    return new Promise(function (resolve, reject) {
      musicDB.find({ uuids: uuid }, { 'meta.genre': 1 }, (err, data) => {
        let genres = []
        if (!err && data.length > 0) {
          genres = [...new Set(data.map(song => song.meta.genre))]
          resolve(genres.sort((a, b) => { return a - b }))
        }
        reject(err)
      })
    })
  },
  genre: (uuid, genre) => {
    return new Promise(function (resolve, reject) {
      musicDB.find({ uuids: uuid, 'meta.genre': genre }, (err, data) => {
        if (!err && data.length > 0) {
          const albums = data.map(s => { return s.meta }).filter((tag, index, array) => array.findIndex(t => t.album === tag.album && t.albumartist === tag.albumartist) === index)
          resolve(albums.sort((a, b) => { return a.title - b.title }))
        }
        reject(err)
      })
    })
  }
}

const add = {
  song: (meta, overwrite, uuid) => {
    return new Promise(function (resolve, reject) {
      musicDB.find({ location: meta.location }, (err, doc) => {
        if (err) {
          reject(err)
        }

        // get the uuids and append user if they're not in the list
        let uuids = []
        if (doc.length > 0) {
          uuids = doc[0].uuids
        }
        if (uuids.includes(uuid) === false) {
          uuids.push(uuid)
        }

        if (overwrite) {
          // we'll update the metadata regardless
          musicDB.update({ location: meta.location }, { location: meta.location, meta: meta, uuids: uuids }, { upsert: true }, (err, doc) => {
            if (err) {
              console.log('Can\'t add file: something went wrong...')
            }
            resolve()
          })
        } else {
          if (doc.length === 0) {
            // new file we've found
            musicDB.insert({ location: meta.location, meta: meta, uuids: uuids }, (err, doc) => {
              if (err) {
                console.log('Can\'t add file: probably exists')
              }
              resolve()
            })
          } else {
            // the file exists, but we're not changing the metadata
            musicDB.update({ location: meta.location }, { $set: { uuids: uuids } }, (err, doc) => {
              if (err) {
                console.log('Can\'t add file: something went wrong')
              }
              resolve()
            })
          }
        }
      })
    })
  }
}

const settings = {
  getDirs: function (uuid) {
    return new Promise(function (resolve, reject) {
      userDB.find({ _id: uuid }, (err, data) => {
        if (!err) {
          resolve(data[0].locations)
        }
      })
    })
  },
  locations: function (uuid) {
    return new Promise(function (resolve, reject) {
      userDB.find({ _id: uuid }, { locations: 1 }, (err, data) => {
        if (!err) {
          if (data.length > 0) {
            resolve(data[0].locations)
          } else {
            resolve([])
          }
        } else {
          reject(err)
        }
      })
    })
  },
  addLocation: function (uuid, location) {
    return new Promise(function (resolve, reject) {
      userDB.update({ _id: uuid }, { $push: { locations: location } }, (err) => {
        if (err) {
          console.log(err)
        }
        resolve(settings.locations(uuid))
      })
    })
  },
  removeLocation: function (uuid, location) {
    return new Promise(function (resolve, reject) {
      userDB.update({ _id: uuid }, { $pull: { locations: location } }, (err) => {
        if (err) {
          console.log(err)
        }
        resolve(settings.locations(uuid))
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
          admin: true,
          locations: []
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
            resolve({ uuid: data[0]._id })
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
