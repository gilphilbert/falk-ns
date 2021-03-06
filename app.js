// express framework
const express = require('express')
const app = express()

// parse JSON body
const bodyParser = require('body-parser')
app.use(bodyParser.json())

// parse cookies
const cookieParser = require('cookie-parser')
app.use(cookieParser())

// for serving files
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

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
      res.send({ state: true, error: 'none' })
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
          res.writeHead(301, { Location: '/' })
        }
      } else {
        res.locals.uuid = user.uuid
        next()
      }
    })
  } else {
    res.status(400).send({ welcome: true })
  }
})

app.get('/api/logout', function (req, res) {
  res.cookie('jwt', null, { 'max-age': 0, httpOnly: true })
  res.json({ message: 'logged out' })
})

app.get('/api/stats', function (req, res) {
  console.log(req)
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
      data.forEach(e => { e.art = `/art/${encodeURIComponent(e.albumartist)}/${encodeURIComponent(e.album)}.jpg` })
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

app.get('/api/stream/:id', function (req, res) {
  let id = req.params.id || null
  if (id !== null) {
    // remove the extension
    id = id.substr(0, id.lastIndexOf('.'))
    // now go find the file
    database.getMusic.url(res.locals.uuid, id)
      .then(data => {
        // streaming the file doesn't allow seeking (annoying)
        //  -> res.setHeader("content-type", "audio/flac")
        //  -> fs.createReadStream(data.location).pipe(res)
        // so let's send the whole file
        res.sendFile(data.location)
      }).catch(e => {
        res.send()
      })
  }
})

app.get('/api/locations', function (req, res) {
  database.settings.locations(res.locals.uuid)
    .then(data => {
      res.json(data)
    }).catch(e => {
      res.json([])
    })
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

app.get('/art/:artist/:album', function (req, res) {
  const artist = req.params.artist
  const album = req.params.album.substr(0, req.params.album.lastIndexOf('.'))
  const _f = album.toLowerCase() + artist.toLowerCase()
  const ext = 'jpg'
  let fn = 'art/' + crypto.createHash('sha1').update(_f).digest('hex') + '.' + ext
  fn = path.resolve(__dirname, fn)
  if (fs.existsSync(fn)) {
    res.sendFile(fn)
  } else {
    res.sendFile(path.resolve(__dirname, 'placeholder.png'))
  }
})
app.get('/art/:artist', function (req, res) {
  res.sendFile(path.resolve(__dirname, 'placeholder.png'))
})

// both currently do the same thing... rescan needs to check for dead files
app.get('/api/update', function (req, res) {
  const uuid = res.locals.uuid
  scanner.scan(uuid)
    .then(() => {
      console.log('update complete')
    })
  // this needs to be non-blocking...
  res.send({ state: 'scanning' })
})
app.get('/api/rescan', function (req, res) {
  const uuid = res.locals.uuid
  scanner.scan(uuid)
    .then(() => {
      console.log('rescan complete')
    })
  // this needs to be non-blocking...
  res.send({ state: 'scanning' })
})

app.get('*', (req, res) => {
  res.sendFile('ui/index.html', { root: __dirname })
})

app.listen(port, () => {
  console.log(`[START] Listening on ${port}`)
})
