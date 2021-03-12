// the cache version gets updated every time there is a new deployment
const CACHE_VERSION = 0
const APP_CACHE = `main-${CACHE_VERSION}`
const IMAGE_CACHE = 'imageV1'

// these are the routes we are going to cache for offline support
const cacheFiles = [
  '/',
  '/css/falk.css',

  '/img/falk-blue-white-square.svg',
  '/img/falk-blue-white.svg',
  '/img/feather-sprite.svg',

  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon.ico',
  '/maskable_icon.png',
  '/mstile-150x150.png',
  '/safari-pinned-tab.svg',
  '/browserconfig.xml',

  '/main.js',
  '/site.webmanifest'
]

// on activation we clean up the previously registered service workers
self.addEventListener('activate', evt =>
  evt.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== APP_CACHE && cacheName !== IMAGE_CACHE) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
)

// on install we download the routes we want to cache for offline
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(APP_CACHE).then(cache => {
      return cache.addAll(cacheFiles)
    })
  )
  self.skipWaiting()
})

// fetch the resource from the network
const fromNetwork = (request, timeout) =>
  new Promise((resolve, reject) => {
    const timeoutId = setTimeout(reject, timeout)
    fetch(request).then(response => {
      clearTimeout(timeoutId)
      resolve(response)
      // update(request)
    }, reject)
  })

// fetch the resource from the browser cache
const fromCache = request => {
  const cacheName = ((request.url.indexOf('/art/') >= 0) ? IMAGE_CACHE : APP_CACHE)
  return caches
    .open(cacheName)
    .then(cache =>
      cache
        .match(request)
        .then(matching => matching)
    )
}
// cache the current page to make it available for offline
const update = request => {
  const cacheName = ((request.url.indexOf('/art/') >= 0) ? IMAGE_CACHE : APP_CACHE)
  caches
    .open(cacheName)
    .then(cache =>
      fetch(request).then(response => cache.put(request, response)).catch(() => {})
    )
}

// general strategy when making a request (eg if online try to fetch it
// from the network with a timeout, if something fails serve from cache)
self.addEventListener('fetch', evt => {
  const ignoredURLs = ['/api/check', '/api/songs/', '/api/update', '/events']
  for (let i = 0; i < ignoredURLs.length; i++) {
    if (evt.request.url.indexOf(ignoredURLs[i]) >= 0) {
      return
    }
  }
  evt.respondWith(
    fromNetwork(evt.request, 10000).catch(() => fromCache(evt.request))
  )
  evt.waitUntil(update(evt.request))
})
