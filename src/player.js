const playerContext = new (window.AudioContext || window.webkitAudioContext)()

const PLAY_MODE_HTML5 = 0
const PLAY_MODE_WEBAUDIO = 1

const STATE_STOP = 0
const STATE_PLAY = 1
const STATE_PAUSE = 2

export class LocalPlayer {
  constructor (tick = 100) {
    this.sources = []
    this.html5Init()
    this.reset()

    this.createDatabase()

    this.gainNode = playerContext.createGain()
    this.gainNode.connect(playerContext.destination)

    this.progressTick = tick

    this._handlers()

    this.cacheWorker = new window.Worker('/js/player-worker.js')
    const handleMessageFromWorker = (msg) => {
      const data = msg.data
      console.log('[MAIN]', data)
      if (data.cached) {
        for (let i = this.queuePos; i < this.queue.length; i++) {
          const el = this.queue[i]
          if (el.id === data.id) {
            el.cached = true
            if (i === this.queuePos) {
              this.switchToWebAudio()
            } else if (i === this.queuePos + 1) {
              this.prepareWebAudio()
            }
          }
        }
      }
    }
    this.cacheWorker.addEventListener('message', handleMessageFromWorker)
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
    this.html5Audio.addEventListener('canplaythrough', () => {
      this.html5Audio.play()
      // if we're playing HTMLAudio5 then we don't have the track cached. Let's fetch it now
      this.cacheQueue()
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
        // this is our "next song" trigger, since web audio has no "play" event
        // if there's another now playing...
        if (this.sources.length) {
          this.startTime = playerContext.currentTime
          this.timeLeft = this.sources[0].buffer.duration
        } else {
          this.startTime = -1
          this.timeLeft = -1
        }

        // shift the queue on
        this.queuePos++
        this.dispatchEvent('queue')
        // increment this song's timesPlayed in the localdb and backend <---------------------------------------------------------

        // tidy up this mess...
        evt.target.disconnect(0)
        if (evt.target.buffer) {
          evt.target.buffer = null
        }
        this.sources.shift()

        // if we're not at the end of the queue
        if (this.queue[this.queuePos + 1]) {
          this.dispatchEvent('next', new window.Event('next'))
          this.prepareWebAudio()
          this.cacheQueue()
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

  /* == try to read the track from IndexedDB ==
  //
  //   retrieve a track from the cache
  //
  */
  loadTrack (index) {
    return new Promise((resolve, reject) => {
      const mdb = window.indexedDB.open('falk', 3).onsuccess = mdb => {
        const tx = mdb.target.result.transaction('cache', 'readonly')
        const store = tx.objectStore('cache')

        const item = this.queue[index]

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
  isCached (id) {
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

  switchToWebAudio () {
    this.loadTrack(this.queuePos, true)
      .then(ab => {
        this.webAudioInit(0)
        this.sources[0].buffer = ab
        console.log('Switching to Web Audio API')
        const curTime = this.html5Audio.currentTime
        this.playMode = PLAY_MODE_WEBAUDIO
        if (this.state === STATE_PLAY) {
          this.html5Audio.pause()
          this.html5Audio.src = ''
          this.sources[0].start(0, curTime)
        }
      })
  }

  prepareWebAudio () {
    this.loadTrack(this.queuePos + 1, true)
      .then(ab => {
        this.webAudioInit(1)
        this.sources[1].buffer = ab
        const scheduleTime = this.startTime + this.timeLeft
        this.sources[1].start(scheduleTime)
        console.log('[MAIN] Next song scheduled')
      })
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
        this.timeLeft = 0
        this.startTime = 0
      } else {
        // supress 'ended' messages for web audio elements
        this.state = STATE_STOP
        this.stopAllWebAudio()
      }
    }

    const item = this.queue[index]

    // check to see if the song is in the cache before we start playing the html5audio element
    if (item.cached) {
      this.loadTrack(index, true)
        .then(ab => {
          this.webAudioInit(0)
          this.sources[0].buffer = ab
          const start = ((this.state === STATE_PAUSE) ? this.sources[0].buffer.duration - this.timeLeft : 0)
          this.sources[0].start(0, start)

          this.startTime = playerContext.currentTime
          if (this.state !== STATE_PAUSE) {
            this.timeLeft = this.sources[0].buffer.duration
          }

          // console.log('Playing Web Audio API from queue data')
          this.dispatchEvent('play', new window.Event('play'))

          this.playMode = PLAY_MODE_WEBAUDIO

          if (this.queue[index + 1] && this.queue[index + 1].cached) {
            // queue up next song if we already have the data in cache (if not, it will be loaded after it's cached)
            this.prepareWebAudio()
          }
        })
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

  toggle () {
    if (this.state === STATE_PLAY) {
      this.pause()
    } else {
      this.play()
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

  skip () {
    this.changePos(this.queuePos + 1)
  }

  prev () {
    // check how long we've been playing for, if it's less than three seconds
    // then skip back, otherwise just start at the beginning of the song
    this.changePos(this.queuePos - 1)
  }

  random () {

  }

  repeat () {

  }

  async addTrack ({ id, url }) {
    id = parseInt(id) || false
    url = url || false
    // check to make sure we have valid results
    if (id !== false && url !== false) {
      let cacheState = false
      try {
        cacheState = await this.isCached(id)
      } catch (e) {
        console.log(e)
      }
      console.log(id, url)
      // define the item
      const item = { id: id, url: url, data: null, cached: cacheState }
      // add to the array
      this.queue.push(item)
    }
  }

  async enqueueOne ({ id, url }) {
    this.addTrack(id, url)
    this.dispatchEvent('queue')
  }

  async enqueue (tracks) {
    if (Array.isArray(tracks)) {
      for (let i = 0; i < tracks.length; i++) {
        await this.addTrack(tracks[i])
      }
    }
    this.dispatchEvent('queue')
  }

  async setTracks (tracks, playPosition = 0, playOnLoad = false) {
    this.reset()
    this.cacheWorker.postMessage({ clear: true })
    this.queuePos = playPosition
    await this.enqueue(tracks)
    if (playOnLoad) {
      this.play()
    }
  }

  changePos (index) {
    this.stop()
    // as long as the queue position is valid, set it
    if (this.queue[index]) {
      this.queuePos = index
    }
    // need to clear audio buffers for songs no longer in the immediate queue
    this.play()
  }

  populateQueue () {
    if (this.queue.length > 0) {
      for (let i = this.queuePos; i < this.queue.length && i <= this.queuePos + 3; i++) {
        console.log(this.queue[i])
      }
    }
  }

  clearQueue () {
    this.reset()
  }

  cacheQueue () {
    // get a list of songs in the queue, loading only the next five songs
    const items = this.queue.slice(this.queuePos).filter(e => e.cached === false).slice(0, 5)
    this.cacheWorker.postMessage({ items: items })
    // need to clear data from old songs
  }

  reset () {
    this.state = STATE_STOP
    this.playMode = false

    this.stopAllWebAudio()
    this.html5Audio.src = ''

    this.startTime = -1
    this.timeLeft = -1

    this.queue = []
    this.queuePos = 0
  }

  createDatabase () {
    window.indexedDB.open('falk', 3).onupgradeneeded = function (e) {
      console.log('test')
      const store = e.target.result.createObjectStore('cache', { keyPath: 'id' })
      store.createIndex('date', 'added')
    }
  }
}
