const cacheName = 'falknsv1'

self.oninstall = function () {
  caches.open(cacheName).then(function (cache) {
    cache.addAll([
      '/',

      '/css/falk.css',

      'https://cdnjs.cloudflare.com/ajax/libs/knockout/3.5.1/knockout-latest.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/navigo/8.9.1/navigo.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/lokijs/1.5.11/lokijs.min.js',
      'https://fonts.googleapis.com/css2?family=Lexend+Deca&display=swap',
      'https://fonts.gstatic.com/s/lexenddeca/v7/K2F1fZFYk-dHSE0UPPuwQ5qnJy8.woff2',

      '/img/falk-blue-white.svg',
      '/img/falk-blue.svg',
      '/img/falk-white.svg',
      '/img/feather-sprite.svg',

      '/android-chrome-192x192.png',
      '/android-chrome-512x512.png',
      '/apple-touch-icon.png',
      '/browserconfig.xml',
      '/favicon-16x16.png',
      '/favicon-32x32.png',
      '/favicon.ico',
      '/main.js',
      '/mstile-150x150.png',
      '/safari-pinned-tab.svg',
      '/site.webmanifest'
    ])
      .catch(e => { console.log(e) })
  })
    .catch(e => { console.log(e) })
}

self.onactivate = function (event) {
  console.log('PWA Running')
}

self.onfetch = function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(async function (cachedFiles) {
        if (cachedFiles) {
          return cachedFiles
        } else {
          const res = fetch(event.request)
          if (event.request.url.startswith('/api/songs') === false) { //don't cache requests for data
            const cache = await caches.open(cacheName)
            cache.put(event.request, res)
          }
          return res
        }
      })
  )
}
