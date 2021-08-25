//const Loki = require('lokijs')
const nano = require('nano')('http://admin:password@localhost:5984')
const crypto = require('crypto')
const { emit } = require('process')
const { domainToASCII } = require('url')

let musicDB = null
let usersDB = null
let locDB = null

let db = false

async function init () {
  //return new Promise(function (resolve, reject) {
    const databases = [ 'tracks', 'users', 'locations' ]

    // used for testing purposes
    for(let i = 0; i< databases.length; i++)
      await nano.db.destroy(databases[i])

    const dblist = await nano.db.list()
    
    for(let i = 0; i< databases.length; i++) {
      const db = databases[i]
      if (!dblist.includes(db)) {
        console.log('database ' + db + ' doesn\'t exist, creating...')
        await nano.db.create(db)
      }
    }

    musicDB = nano.use('tracks')
    usersDB = nano.use('users')
    locDB = nano.use('locations')

    if (!dblist.includes('tracks')) {
      console.log('Creating views')
      const albumMap = function (doc) {
          emit({ album: doc.album, artist: doc.artist, year: doc.year }, null)
      }
      const groupReduce = function(key, values) {
        return true;
      }
      const ddoc = {
        _id: '_design/group',
        views: {
          albums: {
            map: albumMap.toString(),
            reduce: groupReduce
          }
        }
      }
      response = await musicDB.insert(ddoc)
    }

    //////////////////// test stuff ////////////////////
    console.log('testing welcome...')
    await users.welcome('admin', 'password')
    console.log()

    console.log('getting new admin uuid...')
    const user = await users.getUUID('admin', 'password')
    console.log(user)
    console.log()

    console.log('checking is admin for "admin"...')
    console.log(await users.isAdmin(user.uuid))
    console.log()

    console.log('adding new user "phill" identified by "phill"...')
    let allUsers = await users.add(user.uuid, { user: 'phill', pass: 'phill', admin: false, locations: [] })
    console.log(allUsers)
    let phill = allUsers.users.filter(v => v.user === 'phill')[0]
    console.log()

    console.log('getting all users...')
    console.log(await users.getAll(user.uuid))
    console.log()

    console.log('modifying user "phill" setting admin...')
    console.log(await users.modify(user.uuid, { uuid: phill.uuid, user: 'phill', pass: 'phill', admin: true, locations: [] }))
    console.log()

    console.log('removing user "phill"...')
    console.log(await users.remove(user.uuid, phill.uuid))
    console.log()

    console.log('inserting tracks...')
    records = [
      { 'album': 'Silverball', 'albumartist': 'Barenaked Ladies', 'year': 2015, 'genre': 'Rock', 'track': 1, 'title': 'Get Back Up', location: '/mnt/music/Barenaked Ladies/Silverball/01. Get Back Up.flac' },
      { 'album': 'Silverball', 'albumartist': 'Barenaked Ladies', 'year': 2015, 'genre': 'Rock', 'track': 2, 'title': 'Here Before', location: '/mnt/music/Barenaked Ladies/Silverball/02. Here Before.flac' },
      { 'album': 'Silverball', 'albumartist': 'Barenaked Ladies', 'year': 2015, 'genre': 'Rock', 'track': 3, 'title': 'Matter Of Time', location: '/mnt/music/Barenaked Ladies/Silverball/03. Matter Of Time.flac' },
      { 'album': 'Maroon', 'albumartist': 'Barenaked Ladies', 'year': 2000, 'genre': 'Rock', 'track': 1, 'title': 'Too Little Too Late', location: '/mnt/music/Barenaked Ladies/Maroon/01. Too Little Too Late.flac' },
      { 'album': 'Glass Houses', 'albumartist': 'Billy Joel', 'year': 1998, 'genre': 'Rock', 'track': 1, 'title': 'You May Be Right', location: '/mnt/music/Billy Joel/Glass Houses/01. You May Be Right.flac' }
    ]
    for (i = 0; i < records.length; i++) {
      await musicDB.insert(records[i], records[i].location)
    }
    console.log('done')
    console.log()

    /*
    console.log('showing view results...')
    response = await tr.view('group', 'albums', { group: true } )
    response.rows.forEach((doc) => {
      console.log(doc)
    })

    console.log('finding album')
    const albumTitle = "Silverball"
    const albumArtist = "Barenaked Ladies"
    const q = {
      selector: {
        album: albumTitle,
        albumartist: albumArtist
      },
      fields: [ 'album', 'albumartist', 'year', 'genre', 'track', 'title' ]
    }
    response = await tr.find(q)
    response.docs.forEach((doc) => {
      console.log(doc)
    })
    */

    
    /*
    //console.log('Reading single doc')
    //const doc = await alice.get('f14f02a99cf4e379fc49b902c1001755')
    //console.log(doc)



    //nano.db.create('alice', (err, data) => {
    //  console.log(err)
    //  console.log(data)
      // errors are in 'err' & response is in 'data'
    //})
    /*
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
    */
  // resolve()
  //})
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
  mappings: async function (uuid) {
    if (users.isAdmin(uuid)) {
      const locations = await locDB.list({ include_docs: true })
      return locations.rows
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
    return new Promise(function (resolve, reject) {
      usersDB.info().then(data => {
        resolve(data.doc_count)
      })
    })
  },
  welcome: function (username, password) {
    return new Promise(function (resolve, reject) {
      usersDB.find({ selector: { user: 'admin' } })
        .then(res => {
          if (res.docs.length > 0) {
            reject(new Error('already set'))
          } else {
            const account = {
              user: username,
              pass: crypto.createHash('sha256').update(password).digest('hex'),
              admin: true
            }
            usersDB.insert(account)
              .then(res => {
                resolve()
              })
          }
        })
    })
  },
  getUUID: function (username, password) {
    return new Promise(function (resolve, reject) {
      usersDB.find({ selector: { user: username } })
        .then(res => {
          if (res.docs.length > 0) {
            const user = res.docs[0]
            const hash = crypto.createHash('sha256').update(password).digest('hex')
            if (user.pass === hash) {
              resolve({ uuid: user._id, admin: user.admin })
            }
            reject(new Error('incorrect password'))
          } else {
            reject(new Error('not found'))
          }
        })
    })
  },
  isAdmin: async function (uuid) {
    const user = await usersDB.get(uuid)
    return user.admin
  },
  getAll: async function (uuid) {
    const user = await usersDB.get(uuid)
    let users = []
    if (user.admin === true) {
      let users = await usersDB.list({ include_docs: true })
      users = users.rows.map(e => { return { user: e.doc.user, uuid: e.doc._id, admin: e.doc.admin } })
      return users
    }
    return null
  },
  add: async function (uuid, newUser) {
    const user = await usersDB.get(uuid)
    if (user.admin === true) {
      const account = {
        user: newUser.user,
        pass: crypto.createHash('sha256').update(newUser.pass).digest('hex'),
        admin: newUser.admin
      }
      const newAcc = usersDB.insert(account)
      const accID = newAcc._id
      newUser.locations.forEach(l => {
        if (l.enabled) {
          locations.addUser(uuid, l.path, accID)
        } else {
          locations.removeUser(uuid, l.path, accID)
        }
      })
    }
    return { locations: await locations.mappings(uuid), users: await users.getAll(uuid) }
  },
  modify: async function (uuid, editUser) {
    const user = await usersDB.get(uuid)
    if (user.admin === true) {
      const uDoc = await usersDB.get(editUser.uuid)
      uDoc.user = editUser.user
      uDoc.pass = ((editUser.pass && editUser.pass !== '') ? crypto.createHash('sha256').update(editUser.pass).digest('hex') : uDoc.pass)
      uDoc.admin = editUser.admin
      await usersDB.insert(uDoc)
      editUser.locations.forEach(l => {
        if (l.enabled) {
          locations.addUser(uuid, l.path, editUser.id)
        } else {
          locations.removeUser(uuid, l.path, editUser.id)
        }
      })

    }
    return { locations: await locations.mappings(uuid), users: await users.getAll(uuid) }
  },
  remove: async function (uuid, userUUID) {
    const user = await usersDB.get(uuid)
    if (user.admin === true) {
      const userDel = await usersDB.get(userUUID)
      if (userDel.user !== 'admin') {
        await usersDB.destroy(userDel._id, userDel._rev)
      }
    }
    return users.getAll(uuid)
  }
}

init()

module.exports = {
  init,
  tracks,
  locations,
  users
}
