var express = require('express')
var app = express()

var bodyParser = require('body-parser')
app.use(bodyParser.json())

//for sreaming music
var fs = require('fs')
var path = require('path')
var crypto = require('crypto')

const database = require('./database')
const scanner = require('./scanner')


app.get('/api/songs', function (req, res) {
    database.getMusic.allSongs()
        .then(data => {
            res.send(data)
        }).catch(e =>{
            res.send({})
        })
})

app.get('/api/artists', function (req, res) {
    database.getMusic.artists()
        .then(data => {
            data = data.map(i => {
                return { artist: i, art: '/art/' + encodeURIComponent(i) + '.jpg' }
            })
            res.send(data)
        }).catch(e =>{
            res.send({})
        })
})

app.get('/api/artist/:artist', function (req, res) {
    database.getMusic.artistAlbums(req.params.artist)
        .then(data => {
            data.map(i => {
                i.art = `/art/${encodeURIComponent(req.params.artist)}/${encodeURIComponent(i.album)}.jpg`
            })
            res.send(data)
        }).catch(e =>{
            res.send({})
        })
})

app.get('/api/album/:artist/:album', function (req, res) {
    database.getMusic.album(req.params.artist, req.params.album)
        .then(data => {
            data.map(e => { e.art = `/art/${encodeURIComponent(req.params.artist)}/${encodeURIComponent(req.params.album)}.jpg` })
            let retVal = {
                title: req.params.album,
                artist: req.params.artist,
                art: `/art/${encodeURIComponent(req.params.artist)}/${encodeURIComponent(req.params.album)}.jpg`,
                tracks: data
            }
            res.send(retVal)
        }).catch(e =>{
            console.log(e)
            res.send({})
        })
})

app.get('/api/albums', function (req, res) {
    database.getMusic.albums()
        .then(data => {
            data.map(i => {
                i.art = `/art/${encodeURIComponent(i.albumartist)}/${encodeURIComponent(i.album)}.jpg`
            })
            res.send(data)
        }).catch(e =>{
            res.send({})
        })
})

app.get('/api/genres', function (req, res) {
    database.getMusic.genres()
        .then(data => {
            res.send(data)
        }).catch(e =>{
            res.send({})
        })
})

app.get('/api/stream/:id', function (req, res) {
    let id = req.params.id || null
    if (id !== null) {
        //remove the extension
        id = id.substr(0, id.lastIndexOf('.'))
        //now go find the file
        database.getMusic.url(id)
            .then(data => {
                // streaming the file doesn't allow seeking (annoying)
                //  -> res.setHeader("content-type", "audio/flac")
                //  -> fs.createReadStream(data.location).pipe(res)
                // so let's send the whole file
                res.sendFile(data.location)
            }).catch(e =>{
                res.send()
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
    if(fs.existsSync(fn)) {
        res.sendFile(fn)
    } else {
        res.send(path.resolve(__dirname, 'placeholder.png'))
    }
})
app.get('/art/:artist', function (req, res) {
    res.sendFile(path.resolve(__dirname, 'placeholder.png'))
})

app.get('/api/scan', function (req, res) {
    scanner.scan()
        .then(() => {
            console.log('scan complete')
            res.send({ state: 'complete' })
        })
})

//app.use(express.static('ui'))

var serveStatic = require('serve-static')
app.use(serveStatic('ui', { 'index': ['index.html'] }))

// serve the static files (the UI)
//app.use(express.static('ui'))
app.get('*', (req, res) => {
    res.sendFile('ui/index.html', { root: __dirname })
  })

app.listen(3000)