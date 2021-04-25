const fs = require('fs')
// for authentication
const jwt = require('jsonwebtoken')

const database = require('./database')

module.exports = app => {

  app.get('/api/login', (req, res) => {
    res.send('LOGIN')
  })

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

}