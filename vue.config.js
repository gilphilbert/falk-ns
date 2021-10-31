module.exports = {
  devServer: {
    compress: false,
    before: function (app) {
      const config = require('./api/configure')(app)
    },
    after: function (app) {
      const private = require('./api/api')(app)
    },
    historyApiFallback: false,
  },
} 