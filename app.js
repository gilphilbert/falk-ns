// express framework
const express = require('express')
const app = express()


// port we're listening on
const port = 3000

const config = require('./api/configure')(app)

// serve static files here
const { resolve } = require('path')
const publicPath = resolve(__dirname, './dist')
const staticConf = { maxAge: '1y', etag: false }

app.use(express.static(publicPath, staticConf))

// now our secret stuff
const private = require('./api/api')(app)

const server = app.listen(port, () => {
  console.log(`[START] Listening on ${port}`)
})