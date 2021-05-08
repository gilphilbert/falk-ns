const sharp = require('sharp')

// for serving files
const fs = require('fs')
const path = require('path')

// for authentication
const jwt = require('jsonwebtoken')

// other modules (self explanatory)
const scanner = require('./scanner')
const database = require('./database')

// track connected clients
let eventClients = []
// simple function to provide sendEvent(...) function for SSE
sendEvent = (data, { event } = {}) => {
  event = event || null
  const packedData = ((event !== null) ? `event: ${event}\n` : '') + `data: ${JSON.stringify(data)}\n\n`
  let clients = eventClients
  clients.forEach(c => c.res.write(packedData))
}
/*
OK, so this is a little complex.
  In order to send an event from the scanner (which detects file changes), the sendEvent method needs to be accessible from the scanner.
  However, we can't start the scanner until after the database is loaded (since the scanner needs the locations from the database)
  We don't want to keep adding the database as a dependency, so we init the database, passing a callback to start the scanner. This makes sure
  that the database is loaded and accesible *before* the scanner loads. The scanner needs access to sendEvent, so we'll send that as a callback
  to the scanner start
Told you it was complicated!
*/
database.init(() => scanner.watch.start(database, sendEvent))

module.exports = app => {

  app.use(function (req, res, next) {
    const token = req.cookies.jwt

    if (database.users.check() > 0) {
      const publicKey = fs.readFileSync('data/jwtRS256.key.pub', 'utf8')
      jwt.verify(token, publicKey, (err, user) => {
        if (err) {
          res.status(403).json({ error: 'unauthorized' })
        } else {
          res.locals.uuid = user.uuid
          next()
        }
      })
    } else {
      if (req.url.startsWith('/api')) {
        res.status(400).send({ welcome: true })
      } else {
        res.redirect('/')
      }
    }
  })

  app.get('/api/check', function (req, res) {
    res.json({ message: 'logged in' })
  })

  app.get('/api/logout', function (req, res) {
    res.cookie('jwt', null, { 'max-age': 0, httpOnly: true })
    res.json({ message: 'logged out' })
  })

  app.get('/api/songs/all/:offset?/:qty?', function (req, res) {
    const offset = req.params.offset || 0
    const limit = req.params.qty || 4000
    const songs = database.tracks.getAll(res.locals.uuid, offset, limit)
    res.json(songs)
  })

  app.get('/api/locations', function (req, res) {
    const locations = database.locations.mappings(res.locals.uuid)
    if (locations !== null) {
      res.json(locations)
    } else {
      res.status(403).send()
    }
  })
  app.put('/api/locations', function (req, res) {
    const dir = req.body.location || ''
    const users = req.body.users || ''
    if (dir !== '' && Array.isArray(users)) {
      const data = database.locations.add(res.locals.uuid, dir, users)
      if (data) {
        res.send(data)
        scanner.scan([dir])
        scanner.watch.add(dir)
      } else {
        res.status(403).send()
      }
    } else {
      res.status(400).send({ message: 'data missing' })
    }
  })
  app.post('/api/locations', function (req, res) {
    const dir = req.body.location || ''
    const users = req.body.users || ''
    if (dir !== '' && Array.isArray(users)) {
      const data = database.locations.setUsers(res.locals.uuid, dir)
      if (data) {
        res.send(data)
      } else {
        res.status(403).send()
      }
    } else {
      res.status(400).send({ message: 'data missing' })
    }
  })
  app.delete('/api/locations', function (req, res) {
    const dir = req.body.location || ''
    if (dir !== '') {
      const data = database.locations.remove(res.locals.uuid, dir)
      if (data) {
        res.send(data)
        scanner.watch.remove(dir)
      } else {
        res.status(403).send()
      }
    } else {
      res.status(400).send({ message: 'data missing' })
    }
  })

  app.post('/api/directories', function (req, res) {
    const dir = req.body.location || ''
    scanner.getDirs(dir)
      .then((data) => {
        res.send(data)
      })
  })

  function ext2MIME (ext) {
    let val = false
    switch (ext) {
      case 'aac':
        val = 'audio/aac'
        break
      case 'flac':
        val = 'audio/flac'
        break
      case 'mp3':
        val = 'audio/mpeg'
        break
      case 'oga':
        val = 'audio/ogg'
        break
      case 'opus':json
        val = 'audio/opus'
        break
      case 'wav':
        val = 'audio/wav'
        break
    }
    return val
  }

  app.get('/stream/:id', function (req, res) {
    let id = req.params.id || null
    if (id !== null) {
      // remove the extension
      const mime = ext2MIME(id.substr(id.lastIndexOf('.') + 1))
      id = id.substr(0, id.lastIndexOf('.'))
      // now go find the file
      database.getMusic.url(res.locals.uuid, id)
        .then(data => {
          // res.sendFile(data.info.location)
          res.setHeader('content-type', mime)
          fs.createReadStream(data.info.location).pipe(res)
        }).catch(e => {
          res.send()
        })
    }
  })

  app.get('/song/:id', function (req, res) {
    let id = req.params.id || null
    if (id !== null) {
      // remove the extension
      id = id.substr(0, id.lastIndexOf('.'))
      // now go find the file
      const path = database.tracks.getPath(res.locals.uuid, id)
      if (path !== null) {
        res.sendFile(path)
      } else {
        res.status(404).send()
      }
    }
  })

  app.get('/art/:filename?', function (req, res) {
    const filename = req.params.filename || null
    const size = req.query.size || null
    if (filename !== null && filename.indexOf('/') === -1) {
      const fn = path.resolve(__dirname, '../art/' + filename)
      if (fs.existsSync(fn)) {
        const image = sharp(fn)
        image
          .metadata()
          .then(m => {
            res.type(m.format)
            if (size === '800') {
              sharp(fn).resize(800).pipe(res)
            } else if (size === '600') {
              sharp(fn).resize(600).pipe(res)
            } else {
              sharp(fn).resize(350).pipe(res)
            }
          })
      } else {
        res.sendFile(path.resolve(__dirname, '../placeholder.png'))
      }
    } else {
      res.send({})
    }
  })

  app.get('/api/users', function (req, res) {
    const users = database.users.getAll(res.locals.uuid)
    if (users) {
      res.send(users)
    } else {
      res.status(403).send()
    }
  })
  app.put('/api/users', function (req, res) {
    const user = req.body.user || null
    const pass = req.body.pass || null
    const admin = req.body.admin
    const locations = req.body.locations || null

    const missing = []
    if (!user || user === '') {
      missing.push('user')
    }
    if (!pass || pass === '') {
      missing.push('password')
    }
    if (['true', 'false', true, false].includes(admin) === false) {
      missing.push('admin')
    }
    if (!Array.isArray(locations)) {
      missing.push('locations')
    }
    if (missing.length > 0) {
      res.status(400).send({ message: 'missing data', missing: missing })
    } else {
      const users = database.users.add(res.locals.uuid, req.body)
      res.json(users)
    }
    sendEvent({ status: 'complete' }, { event: 'update' })
  })
  app.post('/api/users', function (req, res) {
    const user = req.body.user || null
    const admin = req.body.admin
    const locations = req.body.locations || null
    const id = req.body.id || null

    const missing = []
    if (!id || !Number.isInteger(id)) {
      missing.push('id')
    }
    if (!user || user === '') {
      missing.push('user')
    }
    if (['true', 'false', true, false].includes(admin) === false) {
      missing.push('admin')
    }
    if (!Array.isArray(locations)) {
      missing.push('locations')
    }
    if (missing.length > 0) {
      res.status(400).send({ message: 'missing data', missing: missing })
    } else {
      const users = database.users.modify(res.locals.uuid, req.body)
      res.json(users)
    }
    sendEvent({ status: 'complete' }, { event: 'update' })
  })
  app.delete('/api/users', function (req, res) {
    const delUUID = req.body.uuid
    const users = database.users.remove(res.locals.uuid, delUUID)
    res.json(users)
  })

  // both currently do the same thing... rescan needs to check for dead files
  app.get('/api/update', async function (req, res) {
    const uuid = res.locals.uuid
    res.send({ status: 'started' })
    await scanner.scan(uuid)
    sendEvent({ status: 'complete' }, { event: 'update' })
    // this needs to be non-blocking...
  })

  // endpoint, use whatever name you wish
  app.get('/events', (req, res, next) => {
    // set correct headers to keep connection open
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    // this will allow cross-domain access, only enable if you need it
    // res.setHeader('Access-Control-Allow-Origin', '*')
    res.flushHeaders()
    // simple unique client ID
    const clientID = Date.now()
    // link to this client's open socket
    const client = {
      id: clientID,
      uuid: res.locals.uuid,
      res
    }
    // add new client to the list
    eventClients.push(client)
    // remove disconnected clients
    req.on('close', () => {
      eventClients = eventClients.filter(c => c.id !== clientID)
    })
  })
}
