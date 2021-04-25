module.exports = {
  devServer: {
    before: function (app) {
      const config = require('./api/configure')(app)
      const public = require('./api/public')(app)
      const private = require('./api/private')(app)
    }
  }
}