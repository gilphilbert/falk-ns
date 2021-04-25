const sharp = require('sharp')

// for serving files
const fs = require('fs')
const path = require('path')

// for authentication
const jwt = require('jsonwebtoken')

// other modules (self explanatory)
const database = require('./database')
const scanner = require('./scanner')

module.exports = app => {

  app.use(function (req, res, next) {
      const token = req.cookies.jwt
    
      if (database.users.check() > 0) {
        const publicKey = fs.readFileSync('data/jwtRS256.key.pub', 'utf8')
        jwt.verify(token, publicKey, (err, user) => {
          if (err) {
            if (req.url.startsWith('/api')) {
              res.status(403).json({ error: 'unauthorized' })
            } else {
              res.redirect('/')
            }
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
    
    // track connected clients
    let eventClients = []
    // simple SSE middleware to provide a res.sendEvent(...) function
    app.use(function (req, res, next) {
      res.sendEvent = (data, { event, uuid } = {}) => {
        uuid = uuid || null
        event = eveserveStatic = eventClients
        if (uuid !== null) {
          clients = clients.filter(c => c.uuid === res.locals.uuid)
        }
        clients.forEach(c => c.res.write(packedData))
      }
      next()
    })
    
    app.get('/api/logout', function (req, res) {
      res.cookie('jwt', null, { 'max-age': 0, httpOnly: true })
      res.json({ message: 'logged out' })
    })
    
    app.get('/api/songs/all/:offset?/:qty?', function (req, res) {
      const offset = req.params.offset || 0
      const limit = req.params.qty || 4000
      const songs = database.getMusic.all(res.locals.uuid, offset, limit)
      res.json(songs)
    })
    
    app.get('/api/locations', function (req, res) {
      const locations = database.settings.locations(res.locals.uuid)
      const admin = database.users.getAdmin(res.locals.uuid)
      res.json({ admin: admin, locations: locations })
    })
    app.post('/api/locations', function (req, res) {
      const dir = req.body.location || ''
      if (dir !== '') {
        database.settings.addLocation(res.locals.uuid, dir)
          .then(data => {
            res.send(data)
          }).catch(e => {
            res.send([])
          })
      }
    })
    app.delete('/api/locations', function (req, res) {
      const dir = req.body.location || ''
      if (dir !== '') {
        database.settings.removeLocation(res.locals.uuid, dir)
          .then(data => {
            res.send(data)
          }).catch(e => {
            res.send([])
          })
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
        case 'opus':
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
        database.getMusic.url(res.locals.uuid, id)
          .then(data => {
            res.sendFile(data.info.location)
          }).catch(e => {
            res.send()
          })
      }
    })
    
    app.get('/art/:filename?', function (req, res) {
      const filename = req.params.filename || null
      const size = req.query.full || null
      if (filename !== null && filename.indexOf('/') === -1) {
        const fn = path.resolve(__dirname, '../art/' + filename)
        if (fs.existsSync(fn)) {
          const image = sharp(fn)
          image
            .metadata()
            .then(m => {
              res.type(m.format)
              if (size === 'full') {
                sharp(fn).resize(800).pipe(res)
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
      res.send(users)
    })
    app.post('/api/users', function (req, res) {
      const users = database.users.add(res.locals.uuid, req.body)
      res.json(users)
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
      res.sendEvent({ status: 'complete' }, { event: 'update' })
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
      // setTimeout(() => res.sendEvent({ message: 'test' }, { event: 'test', broadcast: true }), 1000)
    })
  }