// express framework
const express = require('express')
const app = express()
const compression = require('compression')
app.use(compression({ filter: shouldCompress }))
function shouldCompress (req, res) {
  if (req.url.startsWith('/art') || req.url.startsWith('/stream') || req.url.startsWith('/events')) {
    // don't try to compress images (they're already compressed...)
    return false
  }

  // fallback to standard filter function
  return compression.filter(req, res)
}

// parse JSON body
const bodyParser = require('body-parser')
app.use(bodyParser.json())

// parse cookies
const cookieParser = require('cookie-parser')
app.use(cookieParser())

// for serving files
const fs = require('fs')
const path = require('path')
// const crypto = require('crypto')

// for authentication
const jwt = require('jsonwebtoken')

// other modules (self explanatory)
const database = require('./database')
const scanner = require('./scanner')
const keygen = require('./keygen')

// port we're listening on
const port = 3000

// let's check we have keys
keygen.start()

app.post('/api/login', (req, res) => {
  const user = req.body.username || null
  const pass = req.body.password || null
  if (user === null || pass === null) {
    res.status(400).json({ state: 'failed', error: 'invalid' })
  }
  // do some stuff like username/password verification, get the uuid back from the database
  database.users.getUUID(user, pass)
    .then(data => {
      const privateKey = fs.readFileSync('data/jwtRS256.key')
      const token = jwt.sign({ uuid: data.uuid }, privateKey, { algorithm: 'RS256' })
      res.cookie('jwt', token, { httpOnly: true })
      res.send({ state: true, error: 'none', admin: data.admin })
    })
    .catch(() => {
      res.status(400).json({ state: false, error: 'invalid' })
    })
})

app.post('/api/welcome', (req, res) => {
  const user = req.body.username || null
  const pass = req.body.password || null
  if (user !== null && pass !== null) {
    database.users.welcome(user, pass)
      .then(data => {
        if (data.status === true) {
          res.json({ state: true })
        } else {
          res.json({ state: false })
        }
      })
  }
})

// serve the static files (the UI) - needs to come before authentication
const serveStatic = require('serve-static')

app.use(serveStatic('ui', { index: ['index.html'] }))

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
    event = event || null
    const packedData = ((event !== null) ? `event: ${event}\n` : '') + `data: ${JSON.stringify(data)}\n\n`
    let clients = eventClients
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
  if (filename !== null && filename.indexOf('/') === -1) {
    const fn = path.resolve(__dirname, 'art/' + filename)
    if (fs.existsSync(fn)) {
      res.sendFile(fn)
    } else {
      res.sendFile(path.resolve(__dirname, 'placeholder.png'))
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

app.get('*', (req, res) => {
  res.sendFile('ui/index.html', { root: __dirname })
})

app.listen(port, () => {
  console.log(`[START] Listening on ${port}`)
})

/*
const useServerSentEventsMiddleware = (req, res, next) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')

  // only if you want anyone to access this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*')

  res.flushHeaders()

  const sendEventStreamData = (data) => {
    const sseFormattedResponse = `data: ${JSON.stringify(data)}\n\n`
    res.write(sseFormattedResponse)
  }

  // we are attaching sendEventStreamData to res, so we can use it later
  Object.assign(res, {
    sendEventStreamData
  })

  next()
}
const streamRandomNumbers = (req, res) => {
  // We are sending anyone who connects to /stream-random-numbers
  // a random number that's encapsulated in an object
  const interval = setInterval(function generateAndSendRandomNumber () {
    const data = {
      value: Math.random()
    }
    res.sendEventStreamData(data)
    console.log('sent', data)
  }, 1000)

  // close
  res.on('close', () => {
    clearInterval(interval)
    res.end()
  })
}
app.get('/events', useServerSentEventsMiddleware, streamRandomNumbers)
*/

/*
app.get('/api/stats', function (req, res) {
  database.getMusic.stats(res.locals.uuid)
    .then(data => {
      res.send(data)
    }).catch(e => {
      res.send({})
    })
})

app.get('/api/artists', function (req, res) {
  database.getMusic.artists(res.locals.uuid)
    .then(data => {
      data = data.map(i => {
        return { artist: i, art: '/art/' + encodeURIComponent(i) + '.jpg' }
      })
      res.send(data)
    }).catch(e => {
      res.send({})
    })
})

app.get('/api/artist/:artist', function (req, res) {
  database.getMusic.artistAlbums(res.locals.uuid, req.params.artist)
    .then(data => {
      data.forEach(e => { e.art = `/art/${encodeURIComponent(req.params.artist)}/${encodeURIComponent(e.album)}.jpg` })
      res.send(data)
    }).catch(e => {
      res.send({})
    })
})

app.get('/api/album/:artist/:album', function (req, res) {
  database.getMusic.album(res.locals.uuid, req.params.artist, req.params.album)
    .then(data => {
      data.forEach(e => { e.art = `/art/${encodeURIComponent(req.params.artist)}/${encodeURIComponent(req.params.album)}.jpg` })
      const retVal = {
        title: req.params.album,
        artist: req.params.artist,
        art: `/art/${encodeURIComponent(req.params.artist)}/${encodeURIComponent(req.params.album)}.jpg`,
        tracks: data
      }
      res.send(retVal)
    }).catch(e => {
      console.log(e)
      res.send({})
    })
})

app.get('/api/albums', function (req, res) {
  database.getMusic.albums(res.locals.uuid)
    .then(data => {
      // data.forEach(e => { e.art = `/art/${encodeURIComponent(e.albumartist)}/${encodeURIComponent(e.album)}.jpg` })
      res.send(data)
    }).catch(e => {
      res.send({})
    })
})

app.get('/api/genres', function (req, res) {
  database.getMusic.genres(res.locals.uuid)
    .then(data => {
      res.send(data)
    }).catch(e => {
      res.send({})
    })
})

app.get('/api/genre/:genre', function (req, res) {
  database.getMusic.genre(res.locals.uuid, req.params.genre)
    .then(data => {
      data.forEach(e => { e.art = `/art/${encodeURIComponent(e.albumartist)}/${encodeURIComponent(e.album)}.jpg` })
      res.send(data)
    }).catch(e => {
      res.send({})
    })
})

*/

/*
app.get('/art/:artist/:album/', function (req, res) {
  const type = req.query.type || 'cover'

  const artist = req.params.artist.toLowerCase()
  const album = req.params.album.substr(0, req.params.album.lastIndexOf('.')).toLowerCase()
  const fn = 'art/' + crypto.createHash('sha1').update(album + artist).digest('hex') + '-' + type + '.'

  const ext = ['jpg', 'png']
  let sent = false
  ext.forEach(e => {
    const tfn = path.resolve(__dirname, fn + e)
    if (fs.existsSync(tfn)) {
      res.sendFile(tfn)
      sent = true
    }
  })

  if (!sent) {
    res.sendFile(path.resolve(__dirname, 'placeholder.png'))
  }
})
app.get('/art/:filename', function (req, res) {
  const ext = 'jpg'
  const artist = req.params.artist.toLowerCase().substr(0, req.params.artist.lastIndexOf('.'))
  let fn = 'art/' + crypto.createHash('sha1').update(artist).digest('hex') + '.' + ext
  fn = path.resolve(__dirname, fn)
  if (fs.existsSync(fn)) {
    res.sendFile(fn)
  } else {
    res.sendFile(path.resolve(__dirname, 'placeholder.png'))
  }
})
*/
