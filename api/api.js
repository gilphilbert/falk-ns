const sharp = require('sharp')

// for serving files
const fs = require('fs')
const path = require('path')

// for authentication
const jwt = require('jsonwebtoken')

// other modules (self explanatory)
const scanner = require('./scanner')
const database = require('./database')
const mpv = require('./mpv')


// track connected clients
let eventClients = []
// simple function to provide sendEvent(...) function for SSE
sendEvent = (data, { event } = {}) => {
  event = event || null
  const packedData = ((event !== null) ? `event: ${event}\n` : '') + `data: ${JSON.stringify(data)}\n\n`
  eventClients.forEach(c => {
    const st = c.res.write(packedData)
  })
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
mpv.init(sendEvent)

module.exports = app => {
  app.get('/api/play', async function( req, res ) {
    await mpv.player.play()
    res.status(200).send()
  })
  app.get('/api/pause', async function( req, res ) {
    await mpv.player.pause()
    res.status(200).send()
  })
  app.get('/api/toggle', async function( req, res ) {
    await mpv.player.toggle()
    res.status(200).send()
  })
  app.get('/api/prev', async function( req, res ) {
    await mpv.player.prev()
    res.status(200).send()
  })
  app.get('/api/next', async function( req, res ) {
    await mpv.player.next()
    res.status(200).send()
  })
  app.get('/api/stop', async function( req, res ) {
    await mpv.player.stop()
    res.status(200).send()
  })
  app.get('/api/jump/:position', async function( req, res ) {
    await mpv.player.jump(req.params.position)
    res.status(200).send()
  })
  app.get('/api/clear', async function( req, res ) {
    await mpv.player.clear()
    res.status(200).send()
  })
  app.post('/api/enqueue', async function( req, res ) {
    await mpv.player.enqueue(req.body.tracks)
    res.status(200).send()
  })
  app.post('/api/playNext', async function( req, res ) {
    await mpv.player.playnext(req.body.tracks)
    res.status(200).send()
  })
  app.post('/api/replaceAndPlay', async function( req, res ) {
    await mpv.player.replaceAndPlay(req.body.tracks, req.body.index)
    res.status(200).send()
  })

  app.get('/api/stats', async function( req, res ) {
    const stats = await database.library.stats()
    res.json(stats)
  })
  app.get('/api/songs/all/:offset?/:qty?', function (req, res) {
    const offset = req.params.offset || 0
    const limit = req.params.qty || 4000
    const songs = database.tracks.getAll(offset, limit)
    res.json(songs)
  })
  app.get('/api/artists', async function( req, res ) {
    const artists = await database.library.artists()
    if (artists !== null) {
      res.json(artists)
    } else {
      res.status(400).send()
    }
  })
  app.get('/api/artist/:artist', async function( req, res ) {
    const artist = await database.library.artist(req.params.artist)
    res.json(artist)
  })
  app.get('/api/albums', async function( req, res ) {
    const artists = await database.library.albums()
    if (artists !== null) {
      res.json(artists)
    } else {
      res.status(400).send()
    }
  })
  app.get('/api/album/:artist/:album', async function( req, res ) {
    const album = await database.library.album(req.params.artist, req.params.album)
    res.json(album)
  })
  app.get('/api/genres', async function( req, res ) {
    const genres = await database.library.genres()
    res.json(genres)
  })
  app.get('/api/genre/:genre', async function( req, res ) {
    const genre = await database.library.genre(req.params.genre)
    res.json(genre)
  })

  app.get('/api/playlist', function (req, res) {
    const pls = database.playlists.list()
    res.json(pls)
  })
  app.get('/api/playlist/:id', function (req, res) {
    if (!req.params.id) {
      res.status(400).json({ error: "id missing" })
    } else {
      const pl = database.playlists.get(req.params.id)
      if (pl) 
        res.json(pl)
      else
        res.status(400).json({ error: 'invalid id' })
    }
  })
  app.post('/api/playlist', function (req, res) {
    if (!req.body.name) {
      res.status(400).json({ error: "name missing" })
    } else {
      const plId = database.playlists.add(req.body.name)
      res.json({ id: plId })
    }
  })
  app.put('/api/playlist/:id', function (req, res) {
    if (!req.params.id) {
      res.status(400).json({ error: "id missing" })
      return
    }
    if (!req.body.tracks || !Array.isArray(req.body.tracks)) {
      res.status(400).json({ error: "invalid tracks" })
      return
    }
    const status = database.playlists.addTracks(req.params.id, req.body.tracks)
    if (status) {
      res.status(200).send()
    } else {
      res.status(500).json({ error: 'unknown error' })
    }
  })

  app.get('/api/locations', function (req, res) {
    const locations = database.locations.mappings()
    if (locations !== null) {
      res.json(locations)
    } else {
      res.status(403).send()
    }
  })
  app.put('/api/locations', function (req, res) {
    const dir = req.body.location || ''
    if (dir !== '') {
      const data = database.locations.add(dir)
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
  app.delete('/api/locations', function (req, res) {
    const dir = req.body.location || ''
    if (dir !== '') {
      const data = database.locations.remove(dir)
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

  app.get('/api/audio/devices', function (req, res) {
    mpv.player.devices()
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
            switch(size) {
              case 'full':
                sharp(fn).resize(1920).pipe(res)
                break
              case '800':
                sharp(fn).resize(800).pipe(res)
                break
              case '600':
                sharp(fn).resize(600).pipe(res)
                break
              default:
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

  // both currently do the same thing... rescan needs to check for dead files
  app.get('/api/update', async function (req, res) {
    res.send({ status: 'started' })
    await scanner.scan()
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
    //res.setHeader('Access-Control-Allow-Origin', '*')
    res.flushHeaders()
    // simple unique client ID
    const clientID = Date.now()
    // link to this client's open socket
    const client = {
      id: clientID,
      res
    }
    // add new client to the list
    eventClients.push(client)
    // remove disconnected clients
    req.on('close', () => {
      eventClients = eventClients.filter(c => c.id !== clientID)
    })

    mpv.player.sendState()
  })
}
