
module.exports = app => {
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
}