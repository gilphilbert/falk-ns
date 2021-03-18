// the cache version gets updated every time there is a new deployment
const CACHE_VERSION = 1
const APP_CACHE = `main-${CACHE_VERSION}`
const IMAGE_CACHE = 'imageV1'

// importScripts("/dist/localforage.js") <!-- use this to load localForge. Configure for indexeddb, then use. Switch the entire app to indexeddb?
// We could use a serviceworker to populate the database and do background updates (That's pretty cool.)

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

// create the database
indexedDB.open('falk', 2).onupgradeneeded = function (e) {
  const store = e.target.result.createObjectStore('cache', { keyPath: 'id' })
  store.createIndex('date', 'added')
}

function cacheSong (url, response) {
  const id = parseInt(url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.')))
  response.blob().then(blob => {
    indexedDB.open('falk', 2).onsuccess = function (e) {
      const db = e.target.result
      const tx = db.transaction('cache', 'readwrite')
      const store = tx.objectStore('cache')

      store.add({ id: id, added: Date.now(), played: Date.now(), data: blob })
      tx.oncomplete = () => db.close()
    }
  })
}

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
      const cacheCopy = response.clone()
      resolve(response)
      // update(request)
      if (request.url.includes('/stream/')) {
        cacheSong(request.url, cacheCopy)
      } else {
        const cacheName = ((request.url.includes('/art/')) ? IMAGE_CACHE : APP_CACHE)
        caches
          .open(cacheName)
          .then(cache =>
            cache.put(request, cacheCopy)
          )
      }
    }, reject)
  })

// fetch the resource from the browser cache
const fromCache = request =>
  new Promise((resolve, reject) => {
    const cacheName = ((request.url.includes('/art/')) ? IMAGE_CACHE : APP_CACHE)
    caches
      .open(cacheName)
      .then(cache =>
        cache
          .match(request)
          .then(matching => {
            if (matching) {
              resolve(matching)
            } else {
              reject(new Error('not in cache'))
            }
          })
      )
  })

// cache the current page to make it available for offline
const update = request => {
  const cacheName = ((request.url.includes('/art/')) ? IMAGE_CACHE : APP_CACHE)
  caches
    .open(cacheName)
    .then(cache =>
      fetch(request).then(response => cache.put(request, response)).catch(() => {})
    )
}

// general strategy when making a request (eg if online try to fetch it
// from the network with a timeout, if something fails serve from cache)
self.addEventListener('fetch', evt => {
  const ignoredURLs = ['/api/check', '/api/songs/', '/api/update', '/events', '/song/']
  for (let i = 0; i < ignoredURLs.length; i++) {
    if (evt.request.url.indexOf(ignoredURLs[i]) >= 0) {
      return
    }
  }
  if (evt.request.url.includes('/art/') || evt.request.url.includes('/stream/')) {
    evt.respondWith(
      fromCache(evt.request).catch(() => fromNetwork(evt.request, 10000))
    )
  } else {
    evt.respondWith(
      fromNetwork(evt.request, 10000).catch(() => fromCache(evt.request))
    )
    // evt.waitUntil(update(evt.request))
  }
})
