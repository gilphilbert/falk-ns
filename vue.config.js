const crypto = require("crypto");
const crypto_orig_createHash = crypto.createHash;
crypto.createHash = algorithm => crypto_orig_createHash(algorithm == "md4" ? "sha256" : algorithm);

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
