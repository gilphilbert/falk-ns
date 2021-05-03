module.exports = {
  devServer: {
    compress: true,
    before: function (app) {
      const config = require('./api/configure')(app)
      const public = require('./api/public')(app)
    },
    after: function (app) {
      const private = require('./api/private')(app)
    },
    historyApiFallback: false
  }
}