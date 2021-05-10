const Loki = require('lokijs')
const crypto = require('crypto')

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
      const users = locDB.where(l => info.path.startsWith(l.path))[0].users
      musicDB.insert({
        info: info,
        path: info.path,
        users: users.map(e => { return { id: e, meta: { playCount: 0, favorite: false, lastPlayed: false } } }),
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
  getAll: (uuid, offset = 0, limit = 0) => {
    const allSongs = musicDB.chain()
      .find({ 'users.id': uuid })
      .offset(offset)
      .limit(limit)
      .map(doc => { return {
        info: doc.info,
        added: doc.added,
        id: doc.id,
        md: doc.users.filter(d => d.id === uuid)[0].meta
      } })
      .data({ removeMeta: true })
    return allSongs
  },
  getPath: (uuid, id) => {
    const track = musicDB.findOne({ id: parseInt(id), 'users.id': uuid })
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
}

const locations = {
  mappings: function (uuid) {
    if (users.isAdmin(uuid)) {
      return locDB.chain()
        .find()
        .data({ removeMeta: true })
    }
  },
  setUsers: function (uuid, path, uuids) {
    if (users.isAdmin(uuid)) {
      locDB.chain()
        .find({ path: path })
        .update((res) => { res.users = uuids })
      return locations.mappings(uuid)
    }
    return false
  },
  addUser: function (uuid, path, newUser) {
    if (users.isAdmin(uuid)) {
      locDB.chain().find({ path: path }).update(doc => {
        if (doc.users.includes(newUser) === false) {
          doc.users.push(newUser)
          musicDB.chain().where(tr => tr.path.startsWith(doc.path)).update(tr => {
            tr.users.push({ id: newUser, meta: { playCount: 0, favorite: false, lastPlayed: false } })
          })
        }
      })
    }
    return false
  },
  removeUser: function (uuid, path, oldUser) {
    if (users.isAdmin(uuid)) {
      locDB.chain().find({ path: path }).update(doc => {
        if (doc.users.includes(oldUser)) {
          doc.users.splice(doc.users.indexOf(oldUser), 1)
          musicDB.chain().where(tr => tr.path.startsWith(doc.path)).update(tr => {
            const indx = tr.users.find(usr => {
              usr.id === oldUser
            })
            tr.users.splice(indx, 1)
          })
        }
      })
    }
    return false
  },
  add: function (uuid, path, uuids) {
    if (users.isAdmin(uuid)) {
      locDB.insert({ path: path, users: uuids })
      return locations.mappings(uuid)
    }
    return false
  },
  remove: function (uuid, path) {
    if (users.isAdmin(uuid)) {
      // find and remove the location
      locDB.remove(locDB.by('path', path))

      // remove any associated tracks
      musicDB.chain().where(doc => doc.path.startsWith(path)).remove()

      // return the new mappings
      return locations.mappings(uuid)
    }
    return false
  },
  paths: function () {
    return locDB.find().map(e => e.path)
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
        admin: true
      }
      usersDB.insert(account)
      resolve()
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
  isAdmin: function (uuid) {
    const user = usersDB.get(uuid)
    return user.admin
  },
  getAll: function (uuid) {
    const user = usersDB.get(uuid)
    let users = []
    if (user.admin === true) {
      users = usersDB.find()
      users = users.map(e => { return { user: e.user, uuid: e.$loki, admin: e.admin } })
      return users
    }
    return null
  },
  add: function (uuid, newUser) {
    const user = usersDB.get(uuid)
    if (user.admin === true) {
      const account = {
        user: newUser.user,
        pass: crypto.createHash('sha256').update(newUser.pass).digest('hex'),
        admin: newUser.admin
      }
      const accID = usersDB.insert(account).$loki
      newUser.locations.forEach(l => {
        if (l.enabled) {
          locations.addUser(uuid, l.path, accID)
        } else {
          locations.removeUser(uuid, l.path, accID)
        }
      })
    }
    return { locations: locations.mappings(uuid), users: users.getAll(uuid) }
  },
  modify: function (uuid, editUser) {
    const user = usersDB.get(uuid)
    if (user.admin === true) {
      const uDoc = usersDB.get(editUser.id)
      uDoc.user = editUser.user
      uDoc.pass = ((editUser.pass && editUser.pass !== '') ? crypto.createHash('sha256').update(editUser.pass).digest('hex') : uDoc.pass)
      uDoc.admin = editUser.admin
      editUser.locations.forEach(l => {
        if (l.enabled) {
          locations.addUser(uuid, l.path, editUser.id)
        } else {
          locations.removeUser(uuid, l.path, editUser.id)
        }
      })
    }
    return { locations: locations.mappings(uuid), users: users.getAll(uuid) }
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
  init,
  tracks,
  locations,
  users
}
