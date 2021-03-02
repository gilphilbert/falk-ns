var express = require('express')
var app = express()
var fs = require('fs')

const database = require('./database')
const scanner = require('./scanner')


app.get('/api/songs', function (req, res) {
    database.getMusic.allSongs()
        .then(data => {
            res.send(data)
        }).catch(e =>{
            res.send({ 'status': failed })
        })
})

app.get('/api/artists', function (req, res) {
    database.getMusic.artists()
        .then(data => {
            data = data.map(i => {
                return { artist: i, art: '/art/artist/' + encodeURIComponent(i) + '.jpg' }
            })
            res.send(data)
        }).catch(e =>{
            res.send({ 'status': failed })
        })
})

app.get('/api/artist/:artist', function (req, res) {
    database.getMusic.artistAlbums(req.params.artist)
        .then(data => {
            data.map(i => {
                i.art = `/art/album/${encodeURIComponent(i.artist)}/${encodeURIComponent(i.album)}.jpg`
            })
            res.send(data)
        }).catch(e =>{
            res.send({ 'status': failed })
        })
})

app.get('/api/album/:artist/:album', function (req, res) {
    database.getMusic.album(req.params.artist, req.params.album)
        .then(data => {
            let retVal = {
                title: req.params.album,
                artist: req.params.artist,
                art: `/art/album/${encodeURIComponent(req.params.artist)}/${encodeURIComponent(req.params.album)}.jpg`,
                tracks: data
            }
            res.send(retVal)
        }).catch(e =>{
            console.log(e)
            res.send({ 'status': 'failed' })
        })
})

app.get('/api/albums', function (req, res) {
    database.getMusic.albums()
        .then(data => {
            data.map(i => {
                i.art = '/art/album/' + encodeURIComponent(i) + '.jpg'
            })
            res.send(data)
        }).catch(e =>{
            res.send({ 'status': failed })
        })
})

app.get('/api/genres', function (req, res) {
    database.getMusic.genres()
        .then(data => {
            res.send(data)
        }).catch(e =>{
            res.send({ 'status': failed })
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
                res.setHeader("content-type", "audio/flac")
                fs.createReadStream(data.location).pipe(res)
            }).catch(e =>{
                res.send()
            })
        }
})

app.get('/api/scan', function (req, res) {
    scanner.scan('/home/phill/Music')
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