let dlQ = []
let dlRunning = false

self.onmessage = function (msg) {
  const data = msg.data
  if (data.clear) {
    dlQ = []
  }
  if (data.item) {
    if (dlQ.find(el => el.id = item.id)) {
      return
    }
    if (data.place && data.place == 'pop') {
      dlQ.unshift(data.item)
    } else {
      dlQ.push(data.item)
    }
  }
  if (data.items && data.items.length) {
    const items = data.items.filter(el => dlQ.find(i => el.id === i.id))
    dlQ = dlQ.concat(data.items)
  }
  download()
}

/* == store the track in IndexedDB for offline playback ==
//
//   we store tracks in IndexedDB for faster Web Audio API playback
//   and for offline capability. Need to manage the cache so it doesn't
//   grow too large, especially on mobile devices
//
*/
function cacheTrack (id, blob, permanent) {
  // need to check how much space we're consuming and then work out
  // whether we need to delete the oldest track(s) first. This could
  // consume a lot of space, especially for lossless / hires libraries
  return new Promise((resolve, reject) => {
    indexedDB.open('falk', 3).onsuccess = function (e) {
      const db = e.target.result
      const tx = db.transaction('cache', 'readwrite')
      const store = tx.objectStore('cache')

      const request = store.add({ id: id, added: Date.now(), permanent: permanent, played: 0, data: blob })
      request.onsuccess = (event) => {
        resolve()
      }
      tx.oncomplete = () => {
        db.close()
      }
      tx.onerror = () => {
        db.close()
        reject()
      }
    }
  })
}

/* == called when the track isn't in the cache ==
//
//   For a cache miss, got and fetch the track from the server
//   and pass it through the audio decoder. Initiate caching
//   the track for next time.
//
*/
function fetchTrack (item) {
  return new Promise((resolve, reject) => {
    if (!item) {
      reject(new Error('Not in queue'))
    }
    fetch(item.url)
      .then(response => response.blob())
      .then(blob => {
        cacheTrack(item.id, blob, ((item.permanent) ? item.permanent : false))
          .then(() => resolve())
          .catch(e => reject(new Error (e)))
      })
      .catch(e => {
        reject(new Error(e))
      })
  })
}

/* == downloads items from the download queue ==
//
//   Runs through the download queue and pulls the first item
//   from the queue, downloads it and adds it to the cache
//   then sends a message to the main player
//
*/
async function download() {
  if (dlRunning || dlQ.length == 0) {
    return
  }
  dlRunning = true

  const item = dlQ.shift()
  await fetchTrack(item)
    .then(() => {
      console.log('[WORKER] Cached track', item.id)
      self.postMessage({
        cached: true,
        id: item.id
      })    
    })
    .catch(e => {
      console.log('[WORKER]', e)
      self.postMessage({
        cached: false,
        id: item.id
      })    
    })

  dlRunning = false
  download()
}