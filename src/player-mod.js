const playerContext = new (window.AudioContext || window.webkitAudioContext)()
const PLAY_MODE_HTML5 = 0
const PLAY_MODE_WEBAUDIO = 1

const STATE_STOP = 0
const STATE_PLAY = 1
const STATE_PAUSE = 2

const TICK = 100

const sources = []

let state = STATE_STOP
let playMode = false

let startTime = -1
let timeLeft = -1

let queue = []
let queuePos = 0

let eventCallbacks = {}

// create the HTML5 audio element
const html5Audio = new window.Audio()
html5Audio.controls = false
html5Audio.addEventListener('canplaythrough', () => {
  html5Audio.play()
  // if we're playing HTMLAudio5 then we don't have the track cached. Let's fetch it now
  cacheQueue()
})
html5Audio.addEventListener('play', () => {
  dispatchEvent('play', new window.Event('play'))
  startTime = playerContext.currentTime
  timeLeft = html5Audio.duration
  // console.log('Playing HTML5 Audio')
})
const _audio = playerContext.createMediaElementSource(html5Audio)
_audio.connect(playerContext.destination)

createDatabase()

const gainNode = playerContext.createGain()
gainNode.connect(playerContext.destination)

const progressTick = TICK

const cacheWorker = new window.Worker('/js/player-worker.js')
const handleMessageFromWorker = (msg) => {
  const data = msg.data
  console.log('[MAIN]', data)
  if (data.cached) {
    for (let i = queuePos; i < queue.length; i++) {
      const el = queue[i]
      if (el.id === data.id) {
        el.cached = true
        if (i === queuePos) {
          switchToWebAudio()
        } else if (i === queuePos + 1) {
          prepareWebAudio()
        }
      }
    }
  }
}
cacheWorker.addEventListener('message', handleMessageFromWorker)

/* == simple event emitter ==
//
//   attach like this:
//   player.on('play', evt => console.log(evt))
//
*/
function on (name, callback) {
  eventCallbacks = eventCallbacks || {}
  eventCallbacks[name] = eventCallbacks[name] || []
  eventCallbacks[name].push(callback)
}

function dispatchEvent (name, event) {
  eventCallbacks = eventCallbacks || {}
  if (name in eventCallbacks && eventCallbacks[name].length > 0) {
    eventCallbacks[name].forEach(callback => callback(event))
  }
}

/* == functions to get information about the state ==
//
//   get current state, queue position and the ID of the
//   track that's currently playing
//
*/
function currentState () {
  const modes = ['stop', 'play', 'pause']
  return modes[state]
}

function isPaused () {
  return state === STATE_PAUSE
}

function isPlay () {
  return state === STATE_PLAY
}

function currentPos () { return queuePos }

function currentTrackID () {
  if (queue.length > 0) {
    return queue[queuePos].id
  }
  return null
}

function currentQueue () {
  return { queue: queue.map(e => e.meta), pos: queuePos }
}

/* == create an Web Audio API element ==
//
//   used for playback, we switch to this after the file is loaded
//   provides seeking, skipping and gapless playback
//
*/
function webAudioInit (index) {
  sources[index] = playerContext.createBufferSource()
  sources[index].connect(gainNode)
  sources[index].addEventListener('ended', (evt) => {
    if (state === STATE_PLAY) {
      // this is our "next song" trigger, since web audio has no "play" event
      // if there's another now playing...
      if (sources.length) {
        startTime = playerContext.currentTime
        timeLeft = sources[0].buffer.duration
      } else {
        startTime = -1
        timeLeft = -1
      }

      // shift the queue on
      queuePos++
      dispatchEvent('queue', currentQueue())
      // increment this song's timesPlayed in the localdb and backend <---------------------------------------------------------

      // tidy up this mess...
      evt.target.disconnect(0)
      if (evt.target.buffer) {
        evt.target.buffer = null
      }
      sources.shift()

      // if we're not at the end of the queue
      if (queue[queuePos + 1]) {
        dispatchEvent('next', new window.Event('next'))
        prepareWebAudio()
        cacheQueue()
      } else {
        queuePos = 0
        dispatchEvent('stop', new window.Event('stop'))
      }
    }
  })
}

function stopAllWebAudio () {
  for (let i = sources.length - 1; i >= 0; i--) {
    sources[i].disconnect(0)
    sources.pop()
  }
}

/* == try to read the track from IndexedDB ==
//
//   retrieve a track from the cache
//
*/
function loadTrack (index) {
  return new Promise((resolve, reject) => {
    const mdb = window.indexedDB.open('falk', 3).onsuccess = mdb => {
      const tx = mdb.target.result.transaction('cache', 'readonly')
      const store = tx.objectStore('cache')

      const item = queue[index]

      store.get(item.id).onsuccess = (e) => {
        if (e.target.result) {
          e.target.result.data.arrayBuffer()
            .then(buf => {
              console.log('[MAIN] Loaded track ', item.id)
              playerContext.decodeAudioData(buf, function (buffer) {
                resolve(buffer)
              })
            })
            .catch(e => reject(new Error('Cache invalid')))
        } else {
          reject(new Error('Not in cache'))
          console.log(item)
        }
      }
      tx.onerror = (e) => reject(e) // the store doesn't existself.path
    }
    mdb.onerror = (e) => reject(e) // couldn't open the database
  })
}

/* == check if the track is cached in IndexedDB ==
//
//   check the IndexedDB db to see if this track is cached
//
*/
function isCached (id) {
  return new Promise((resolve, reject) => {
    const mdb = window.indexedDB.open('falk', 3).onsuccess = mdb => {
      const tx = mdb.target.result.transaction('cache', 'readonly')
      const store = tx.objectStore('cache')

      store.get(id).onsuccess = (e) => {
        if (e.target.result) {
          resolve(true)
        } else {
          // the track isn't in the database
          resolve(false)
        }
      }
      tx.onerror = (e) => reject(e) // the store doesn't exist
    }
    mdb.onerror = (e) => reject(e) // couldn't open the database
  })
}

function switchToWebAudio () {
  loadTrack(queuePos, true)
    .then(ab => {
      webAudioInit(0)
      sources[0].buffer = ab
      console.log('Switching to Web Audio API')
      const curTime = html5Audio.currentTime
      playMode = PLAY_MODE_WEBAUDIO
      if (state === STATE_PLAY) {
        html5Audio.pause()
        html5Audio.src = ''
        sources[0].start(0, curTime)
      }
    })
}

function prepareWebAudio () {
  loadTrack(queuePos + 1, true)
    .then(ab => {
      webAudioInit(1)
      sources[1].buffer = ab
      const scheduleTime = startTime + timeLeft
      sources[1].start(scheduleTime)
      console.log('[MAIN] Next song scheduled')
    })
}

window.onbeforeunload = () => {
  stopAllWebAudio()
  return null
}
const progress = () => {
  if (state === STATE_PLAY) {
    window.setTimeout(progress, progressTick)
    const duration = html5Audio.duration || ((sources[0]) ? sources[0].buffer.duration : null) || false
    if (duration !== false) {
      dispatchEvent('progress', new window.CustomEvent('progress', { detail: { elapsed: duration - (timeLeft - (playerContext.currentTime - startTime)), duration: duration } }))
    }
  }
}

/* == called when the track isn't in the cache ==
//
//   Test function
//
*/
function play (index = -1) {
  // resume, in case user left / returned
  playerContext.resume()

  // first, check if we're paused and we haven't loaded the web audio - just start playing
  if (state === STATE_PAUSE && playMode === PLAY_MODE_HTML5) {
    html5Audio.play()
    return
  }

  // if no index was provided, use the current queue position
  if (index < 0) {
    index = queuePos
  }

  // check the request is a position in the queue
  if (queue.length < 0 || index >= queue.length) {
    throw new Error('Invalid queue position')
  }

  // if we're already playing, stop
  if (state === STATE_PLAY) {
    if (playMode === PLAY_MODE_HTML5) {
      html5Audio.pause()
      html5Audio.src = ''
      timeLeft = 0
      startTime = 0
    } else {
      // supress 'ended' messages for web audio elements
      state = STATE_STOP
      stopAllWebAudio()
    }
  }

  const item = queue[index]

  // check to see if the song is in the cache before we start playing the html5audio element
  if (item.cached) {
    loadTrack(index, true)
      .then(ab => {
        webAudioInit(0)
        sources[0].buffer = ab
        const start = ((state === STATE_PAUSE) ? sources[0].buffer.duration - timeLeft : 0)
        sources[0].start(0, start)

        startTime = playerContext.currentTime
        if (state !== STATE_PAUSE) {
          timeLeft = sources[0].buffer.duration
        }

        // console.log('Playing Web Audio API from queue data')
        dispatchEvent('play', new window.Event('play'))

        playMode = PLAY_MODE_WEBAUDIO

        if (queue[index + 1] && queue[index + 1].cached) {
          // queue up next song if we already have the data in cache (if not, it will be loaded after it's cached)
          prepareWebAudio()
        }
      })
  } else {
    html5Audio.src = item.url
    playMode = PLAY_MODE_HTML5
  }
  state = STATE_PLAY
  progress()
}

/* == pauses playback
//
//   determine playback type and pause / stop
//
*/
function pause () {
  if (state !== STATE_PLAY) {
    return
  }
  state = STATE_PAUSE
  dispatchEvent('pause', new window.Event('pause'))
  if (playMode === PLAY_MODE_HTML5) {
    timeLeft = timeLeft - (playerContext.currentTime - startTime)
    html5Audio.pause()
  } else if (playMode === PLAY_MODE_WEBAUDIO) {
    timeLeft = timeLeft - (playerContext.currentTime - startTime)
    stopAllWebAudio()
  }
}

function toggle () {
  if (state === STATE_PLAY) {
    pause()
  } else {
    play()
  }
}

function stop () {
  if (playMode === PLAY_MODE_HTML5) {
    html5Audio.pause()
    html5Audio.src = ''
  } else {
    stopAllWebAudio()
  }
  state = STATE_STOP
  dispatchEvent('stop', new window.Event('stop'))
  timeLeft = 0
  startTime = 0
  queuePos = 0
}

function skip () {
  changePos(queuePos + 1)
  dispatchEvent('next', new window.Event('next'))
}

function prev () {
  // check how long we've been playing for, if it's less than three seconds
  // then skip back, otherwise just start at the beginning of the song
  changePos(queuePos - 1)
}

function random () {

}

function repeat () {

}

async function addTrack ({ id, url, meta }) {
  id = parseInt(id) || false
  url = url || false
  // check to make sure we have valid results
  if (id !== false && url !== false) {
    let cacheState = false
    try {
      cacheState = await isCached(id)
    } catch (e) {
      console.log(e)
    }
    console.log(id, url)
    // define the item
    const item = { id: id, url: url, data: null, cached: cacheState, meta: meta }
    // add to the array
    queue.push(item)
  }
}

async function enqueueOne ({ id, url, meta }) {
  addTrack(id, url, meta)
  dispatchEvent('queue', currentQueue())
}

async function enqueue (tracks) {
  if (Array.isArray(tracks)) {
    for (let i = 0; i < tracks.length; i++) {
      await addTrack(tracks[i])
    }
  }
  dispatchEvent('queue', currentQueue())
}

async function setTracks (tracks, playPosition = 0, playOnLoad = false) {
  reset()
  cacheWorker.postMessage({ clear: true })
  queuePos = playPosition
  await enqueue(tracks)
  if (playOnLoad) {
    play()
  }
}

function changePos (index) {
  stop()
  // as long as the queue position is valid, set it
  if (queue[index]) {
    queuePos = index
  }
  // need to clear audio buffers for songs no longer in the immediate queue
  play()
}

function cacheQueue () {
  // get a list of songs in the queue, loading only the next five songs
  const items = queue.slice(queuePos).filter(e => e.cached === false).slice(0, 5)
  cacheWorker.postMessage({ items: items })
  // need to clear data from old songs
}

function reset () {
  state = STATE_STOP
  playMode = false

  stopAllWebAudio()
  html5Audio.src = ''

  startTime = -1
  timeLeft = -1

  queue = []
  queuePos = 0
}

function createDatabase () {
  window.indexedDB.open('falk', 3).onupgradeneeded = function (e) {
    console.log('test')
    const store = e.target.result.createObjectStore('cache', { keyPath: 'id' })
    store.createIndex('date', 'added')
  }
}

module.exports = {
  getState: currentState,
  getPos: currentPos,
  isPlay,
  isPaused,
  getCurrentTrackID: currentTrackID,
  on,
  play,
  toggle,
  stop,
  skip,
  prev,
  enqueue,
  enqueueOne,
  setTracks,
  random,
  repeat,
  changePos,
  getQueue: currentQueue
}
