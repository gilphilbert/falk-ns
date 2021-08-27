module.exports = {
  devServer: {
    compress: false,
    before: function (app) {
      const config = require('./api/configure')(app)
    },
    after: function (app) {
      const private = require('./api/api')(app)
    },
    historyApiFallback: false
  },
  pwa: {
    name: 'FALK NS',
    short_name: 'FALK NS',
    themeColor: '#2A2A2A',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    display: 'standalone',
    start_url: '/',
    workboxOptions: {
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: true,
      // swSrc is required in InjectManifest mode.
      // swSrc: 'dev/sw.js',
      // ...other Workbox options...
      exclude: [
        /\.map$/, 
        /manifest\.json$/,
      ],
      navigateFallback: '/index.html',
      // Define runtime caching rules.
      runtimeCaching: [{
        // Match any request that ends with .png, .jpg, .jpeg or .svg.
        urlPattern: new RegExp('/art/.*'),
    
        // Apply a cache-first strategy.
        handler: 'CacheFirst',
    
        options: {
          // Use a custom cache name.
          cacheName: 'images',
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'google-fonts-webfonts'
        }
      }],
    },  
    iconPaths: {
      favicon32: 'favicon-32x32.png',
      favicon16: 'favicon-16x16.png',
      appleTouchIcon: null,
      maskIcon: 'safari-pinned-tab.svg',
      msTileImage: 'mstile-150x150.png'
    },
    manifestOptions: {
      background_color: "#F1AD2D",
      icons: [
        {
          src: "./android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "./android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "./maskable_icon.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    }
  }
} 