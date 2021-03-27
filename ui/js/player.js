const playerContext = new (window.AudioContext || window.webkitAudioContext)()

const PLAY_MODE_HTML5 = 0
const PLAY_MODE_WEBAUDIO = 1

const STATE_STOP = 0
const STATE_PLAY = 1
const STATE_PAUSE = 2

export class LocalPlayer {
  constructor (tick = 100) {
    this.state = STATE_STOP
    this.playMode = false

    this.sources = []

    this.gainNode = playerContext.createGain()
    this.gainNode.connect(playerContext.destination)

    this.html5Init()

    this.startTime = -1
    this.timeLeft = -1

    this.queue = []
    this.queuePos = 0

    this.progressTick = tick

    this._handlers()
  }

  /* == simple event emitter ==
  //
  //   attach like this:
  //   player.on('play', evt => console.log(evt))
  //
  */
  on (name, callback) {
    this.eventCallbacks = this.eventCallbacks || {}
    this.eventCallbacks[name] = this.eventCallbacks[name] || []
    this.eventCallbacks[name].push(callback)
  }

  dispatchEvent (name, event) {
    this.eventCallbacks = this.eventCallbacks || {}
    if (name in this.eventCallbacks && this.eventCallbacks[name].length > 0) {
      this.eventCallbacks[name].forEach(callback => callback(event))
    }
  }

  /* == functions to get information about the state ==
  //
  //   get current state, queue position and the ID of the
  //   track that's currently playing
  //
  */
  currentState () {
    const modes = ['stop', 'play', 'pause']
    return modes[this.state]
  }

  isPaused () {
    return this.state === STATE_PAUSE
  }

  isPlay () {
    return this.state === STATE_PLAY
  }

  currentPos () { return this.parent.queuePos }

  currentTrackID () {
    const self = this.parent
    if (self.queue.length > 0) {
      return self.queue[self.queuePos].id
    }
    return null
  }

  /* == create an HTML5 Audio element ==
  //
  //   used to start playback quickly (streaming)
  //
  */
  html5Init () {
    // create the HTML5 audio element
    this.html5Audio = new window.Audio()
    this.html5Audio.controls = false
    this.html5Audio.addEventListener('canplay', () => {
      this.html5Audio.play()
    })
    this.html5Audio.addEventListener('play', () => {
      this.dispatchEvent('play', new window.Event('play'))
      this.startTime = playerContext.currentTime
      this.timeLeft = this.html5Audio.duration
      // console.log('Playing HTML5 Audio')
    })
    const _audio = playerContext.createMediaElementSource(this.html5Audio)
    _audio.connect(playerContext.destination)
  }

  /* == create an Web Audio API element ==
  //
  //   used for playback, we switch to this after the file is loaded
  //   provides seeking, skipping and gapless playback
  //
  */
  webAudioInit (index) {
    this.sources[index] = playerContext.createBufferSource()
    this.sources[index].connect(this.gainNode)
    this.sources[index].addEventListener('ended', (evt) => {
      if (this.state === STATE_PLAY) {
        // kill old source
        evt.target.disconnect(0)
        if (evt.target.buffer) {
          evt.target.buffer = null
        }
        this.sources.shift()

        // this is our "next song" trigger, since web audio has no "play" event
        this.startTime = playerContext.currentTime
        this.timeLeft = this.sources[0].buffer.duration

        // shift the queue on
        this.queuePos++

        // if we're not at the end of the queue
        if (this.queue[this.queuePos + 1]) {
          this.dispatchEvent('next', new window.Event('next'))
          this.prepareWebAudio()
          if (this.queue[this.queuePos + 2]) {
            this.loadTrack(this.queuePos + 2)
              .then(ab => { this.queue[this.queuePos + 2].data = ab })
          }
        } else {
          this.queuePos = 0
          this.dispatchEvent('stop', new window.Event('stop'))
        }
      }
    })
  }

  stopAllWebAudio () {
    for (let i = this.sources.length - 1; i >= 0; i--) {
      this.sources[i].disconnect(0)
      this.sources.pop()
    }
  }

  /* == store the track in IndexedDB for offline playback ==
  //
  //   we store tracks in IndexedDB for faster Web Audio API playback
  //   and for offline capability. Need to manage the cache so it doesn't
  //   grow too large, especially on mobile devices
  //
  */
  cacheTrack (id, blob) {
    // need to check how much space we're consuming and then work out
    // whether we need to delete the oldest track(s) first. This could
    // consume a lot of space, especially for lossless / hires libraries
    window.indexedDB.open('falk', 2).onsuccess = function (e) {
      const db = e.target.result
      const tx = db.transaction('cache', 'readwrite')
      const store = tx.objectStore('cache')

      store.add({ id: id, added: Date.now(), played: Date.now(), data: blob })
      tx.oncomplete = () => db.close()
    }
  }

  /* == called when the track isn't in the cache ==
  //
  //   For a cache miss, got and fetch the track from the server
  //   and pass it through the audio decoder. Initiate caching
  //   the track for next time.
  //
  */
  fetchTrack (item) {
    return new Promise((resolve, reject) => {
      if (!item) {
        reject(new Error('Not in queue'))
      }
      window.fetch(item.url)
        .then(response => response.blob())
        .then(async blob => {
          const ab = await blob.arrayBuffer()
          playerContext.decodeAudioData(ab, function (buffer) {
            resolve(buffer)
          })
          // this.cacheTrack(item.id, blob) // <=================================================================
        })
        .catch(e => {
          reject(new Error('Could not fetch track'))
        })
    })
  }

  /* == try to read the track from IndexedDB ==
  //
  //   before we pull the track from online, try to grab the track
  //   from the local cache - saves bandwidth and we don't need to
  //   mess about with the HTML5 Audio element
  //
  */
  loadTrack (index) {
    return new Promise((resolve, reject) => {
      const mdb = window.indexedDB.open('falk', 2).onsuccess = mdb => {
        const tx = mdb.target.result.transaction('cache', 'readonly')
        const store = tx.objectStore('cache')

        const item = this.queue[index]

        store.get(item.id).onsuccess = (e) => {
          if (e.target.result) {
            resolve(e.target.result.data.arrayBuffer())
          } else {
            // the track isn't in the database, let's fetch it
            this.fetchTrack(item)
              .then(ab => resolve(ab))
              .catch(e => reject(e))
          }
        }
        tx.onerror = (e) => reject(e) // the store doesn't exist
      }
      mdb.onerror = (e) => reject(e) // couldn't open the database
    })
  }

  switchToWebAudio () {
    this.webAudioInit(0)
    this.sources[0].buffer = this.queue[this.queuePos].data
    // console.log('Switching to Web Audio API')
    const curTime = this.html5Audio.currentTime
    this.playMode = PLAY_MODE_WEBAUDIO
    if (this.state === STATE_PLAY) {
      this.html5Audio.pause()
      this.html5Audio.src = ''
      this.sources[0].start(0, curTime)
    }
  }

  prepareWebAudio () {
    this.webAudioInit(1)
    this.sources[1].buffer = this.queue[this.queuePos + 1].data
    const scheduleTime = this.startTime + this.timeLeft
    this.sources[1].start(scheduleTime)
    // console.log('Next song scheduled')
  }

  _handlers () {
    window.onbeforeunload = () => {
      this.stopAllWebAudio()
      return null
    }
    this.progress = () => {
      if (this.state === STATE_PLAY) {
        window.setTimeout(this.progress, this.progressTick)
        const duration = this.html5Audio.duration || ((this.sources[0]) ? this.sources[0].buffer.duration : null) || false
        if (duration !== false) {
          this.dispatchEvent('progress', new window.CustomEvent('progress', { detail: { elapsed: duration - (this.timeLeft - (playerContext.currentTime - this.startTime)), duration: duration } }))
        }
      }
    }
  }

  /* == called when the track isn't in the cache ==
  //
  //   Test function
  //
  */
  play (index = -1) {
    // resume, in case user left / returned
    playerContext.resume()

    // first, check if we're paused and we haven't loaded the web audio - just start playing
    if (this.state === STATE_PAUSE && this.playMode === PLAY_MODE_HTML5) {
      this.html5Audio.play()
      return
    }

    // if no index was provided, use the current queue position
    if (index < 0) {
      index = this.queuePos
    }

    // check the request is a position in the queue
    if (this.queue.length < 0 || index >= this.queue.length) {
      throw new Error('Invalid queue position')
    }

    // if we're already playing, stop
    if (this.state === STATE_PLAY) {
      if (this.playMode === PLAY_MODE_HTML5) {
        this.html5Audio.pause()
        this.html5Audio.src = ''
      } else {
        // supress 'ended' messages for web audio elements
        this.state = STATE_STOP
        this.stopAllWebAudio()
      }
      this.timeLeft = 0
      this.startTime = 0
    }

    const item = this.queue[index]

    // check to see if the song is in the cache before we start playing the html5audio element
    if (item.data) {
      this.webAudioInit(0)
      this.sources[0].buffer = item.data
      const start = ((this.state === STATE_PAUSE) ? this.sources[0].buffer.duration - this.timeLeft : 0)
      this.sources[0].start(0, start)

      this.startTime = playerContext.currentTime
      if (this.state !== STATE_PAUSE) {
        this.timeLeft = this.sources[0].buffer.duration
      }

      // console.log('Playing Web Audio API from queue data')
      this.dispatchEvent('play', new window.Event('play'))

      this.playMode = PLAY_MODE_WEBAUDIO

      if (this.queue[index + 1] && this.queue[index + 1].data) {
        // queue up next song...
        this.prepareWebAudio()
      }
    } else {
      this.html5Audio.src = item.url
      this.playMode = PLAY_MODE_HTML5
    }
    this.state = STATE_PLAY
    this.progress()
  }

  /* == pauses playback
  //
  //   determine playback type and pause / stop
  //
  */
  pause () {
    if (this.state !== STATE_PLAY) {
      return
    }
    this.state = STATE_PAUSE
    this.dispatchEvent('pause', new window.Event('pause'))
    if (this.playMode === PLAY_MODE_HTML5) {
      this.timeLeft = this.timeLeft - (playerContext.currentTime - this.startTime)
      this.html5Audio.pause()
    } else if (this.playMode === PLAY_MODE_WEBAUDIO) {
      this.timeLeft = this.timeLeft - (playerContext.currentTime - this.startTime)
      this.stopAllWebAudio()
    }
  }

  stop () {
    if (this.playMode === PLAY_MODE_HTML5) {
      this.html5Audio.pause()
      this.html5Audio.src = ''
    } else {
      this.stopAllWebAudio()
    }
    this.state = STATE_STOP
    this.dispatchEvent('stop', new window.Event('stop'))
    this.timeLeft = 0
    this.startTime = 0
    this.queuePos = 0
  }

  async fetchQueue () {
    if (this.queueFetcherRunning === true) {
      return
    }
    this.queueFetcherRunning = true
    while (this.queueFetcher.length) {
      const id = this.queueFetcher.shift()
      const item = this.queue.find(e => e.id === id)
      if (item.data === null) {
        try {
          const arrayBuffer = await this.fetchTrack(item)
          const queueItem = this.queue.find(e => e.id === item.id)
          if (queueItem) {
            queueItem.data = arrayBuffer
          }
          if (this.state === STATE_PLAY && this.queue.findIndex(e => e.id === id) === this.queuePos) {
            this.switchToWebAudio()
          }
          if (this.state === STATE_PAUSE && this.queue.findIndex(e => e.id === id) === this.queuePos) {
            // switch to web audio while paused
            // console.log('Switching to Web Audio while paused')
            this.playMode = PLAY_MODE_WEBAUDIO
          }
          if (this.state === STATE_PLAY && this.queue.findIndex(e => e.id === id) === this.queuePos + 1) {
            this.prepareWebAudio()
          }
        } catch (e) {
          console.log(e)
        }
      }
    }
    this.queueFetcherRunning = false
  }

  populateQueue () {
    this.queueFetcher = []
    for (let i = this.queuePos; i <= this.queuePos + 2; i++) {
      if (this.queue[i] && this.queue[i].data === null) {
        this.queueFetcher.push(this.queue[i].id)
      }
    }
    this.fetchQueue()
  }

  enqueueOne ({ id, url }) {
    id = parseInt(id) || false
    url = url || false
    // check to make sure we have valid results
    if (id !== false && url !== false) {
      // define the item
      const item = { id: id, url: url, data: null }
      // add to the array and get back the array length
      this.queue.push(item)
      // if this is one of the first two songs at queuePos
      this.populateQueue()
    }
  }

  enqueue (tracks) {
    if (Array.isArray(tracks)) {
      tracks.forEach(t => this.enqueueOne(t))
    }
  }

  clearQueue () {
    this.stop()
    this.queue = []
    this.queuePos = 0
  }

  // function to move the pointer to the current queue item
}
