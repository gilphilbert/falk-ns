const playerContext = new (window.AudioContext || window.webkitAudioContext)()

const PLAY_MODE_HTML5 = 0
const PLAY_MODE_WEBAUDIO = 1

const STATE_STOP = 0
const STATE_PLAY = 1
const STATE_PAUSE = 2

export class Player {
  constructor () {
    this.state = STATE_STOP
    this.playMode = false

    this.sources = []
    this.gainNodes = []

    this.html5Init()
    this.webAudioInit(0)

    this.queue = []
    this.queuePos = -1

    // called whenever an audio device plays
    this.playEvent = () => {
      if (this.state !== STATE_PLAY) {
        this.dispatchEvent('play', new window.Event('play'))
        this.state = STATE_PLAY
      }
    }

    this._handlers()
  }

  /* == simple event emitter ==
  //
  //   attach like this:
  //   player.on('play', evt => console.log(evt))
  //
  */
  on (name, callback) {
    const self = this.parent
    self.eventCallbacks = self.eventCallbacks || {}
    self.eventCallbacks[name] = self.eventCallbacks[name] || []
    self.eventCallbacks[name].push(callback)
  }

  dispatchEvent (name, event) {
    const self = this.parent
    self.eventCallbacks = self.eventCallbacks || {}
    if (name in self.eventCallbacks && self.eventCallbacks[name].length > 0) {
      self.eventCallbacks[name].forEach(callback => callback(event))
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
    return modes[this.parent.state]
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
    this.html5Audio.addEventListener('canplay', this.html5CanPlay)
    this.html5Audio.addEventListener('canplaythrough', this.html5CanPlayThrough)
    this.html5Audio.addEventListener('play', this.playEvent)
    const _audio = playerContext.createMediaElementSource(this.html5Audio)
    _audio.connect(playerContext.destination)

    this.html5CanPlay = () => {
      this.html5Audio.play()
      console.log('Playing HTML5 Audio')
    }

    this.html5CanPlayThrough = () => {
      // console.log('can play through!')
    }
  }

  /* == create an Web Audio API element ==
  //
  //   used for playback, we switch to this after the file is loaded
  //   provides seeking, skipping and gapless playback
  //
  */
  webAudioInit (index) {
    this.gainNodes[index] = playerContext.createGain()
    this.sources[index] = playerContext.createBufferSource()
    this.sources[index].connect(this.gainNodes[index])
    this.gainNodes[index].connect(playerContext.destination)
  }

  /* == store the track in IndexedDB for offline playback ==
  //
  //   we store tracks in IndexedDB for faster Web Audio API playback
  //   and for offline capability. Need to manage the cache so it doesn't
  //   grow too large, especially on mobile devices
  //
  */
  cacheTrack (id, blob) {
    // need to check how much space we're consuming and then work out whether we need to delete the oldest track(s) first
    window.indexedDB.open('falk', 2).onsuccess = function (e) {
      const db = e.target.result
      const tx = db.transaction('cache', 'readwrite')
      const store = tx.objectStore('cache')

      store.add({ id: id, added: Date.now(), played: Date.now(), data: blob })
      tx.oncomplete = () => db.close()
    }
  }

  /* == try to read the track from IndexedDB ==
  //
  //   before we pull the track from online, try to grab the track
  //   from the local cache - saves bandwidth and we don't need to
  //   mess about with the HTML5 Audio element
  //
  */
  readCache (id) {
    return new Promise((resolve, reject) => {
      const mdb = window.indexedDB.open('falk', 2).onsuccess = mdb => {
        const tx = mdb.target.result.transaction('cache', 'readonly')
        const store = tx.objectStore('cache')
        store.get(id).onsuccess = (e) => {
          if (e.target.result) {
            resolve(e.target.result.data.arrayBuffer())
          } else {
            reject(new Error(''))
          }
        }
        tx.onerror = () => reject(new Error('')) // the store doesn't exist
      }
      mdb.onerror = () => reject(new Error(''))
    })
  }

  /* == called when the track isn't in the cache ==
  //
  //   For a cache miss, got and fetch the track from the server
  //   and pass it through the audio decoder. Initiate caching
  //   the track for next time.
  //
  */
  loadTrack (id, url) {
    return new Promise((resolve, reject) => {
      window.fetch(url)
        .then(response => response.blob())
        .then(async blob => {
          const ab = await blob.arrayBuffer()
          playerContext.decodeAudioData(ab, function (buffer) {
            resolve(buffer)
          })
          // this.cacheTrack(id, blob)
        })
        .catch(e => {
          reject(new Error('Could not fetch track'))
        })
    })
  }

  _handlers () {
    this.switchToWebAudio = (buffer) => {
      console.log('here')
      this.sources[0].buffer = buffer
      console.log('Switching to Web Audio API')
      const offset = this.html5Audio.currentTime
      this.playMode = PLAY_MODE_WEBAUDIO
      console.log(this.state)
      if (this.state === STATE_PLAY) {
        this.html5Audio.pause()
        this.sources[0].start(0, offset)
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

    // first, check if we're paused. If we are, just start playing.
    if (this.state === STATE_PAUSE) {
      // unpause
      if (this.playMode === PLAY_MODE_HTML5) {
        this.html5Audio.play()
      } else {
        this.sources[0].play()
      }
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

    // if we're playing, stop
    if (this.state === STATE_PLAY) {
      if (this.playMode === PLAY_MODE_HTML5) {
        this.html5Audio.pause()
      } else {
        this.sources[0].stop()
      }
    }

    const id = this.queue[index].id
    const url = this.queue[index].url

    // check to see if the song is in the cache before we start playing the html5audio element    const url = `/song/${id}.${ext}`
    this.readCache(id)
      .then(ab => {
        playerContext.decodeAudioData(ab, (buffer) => {
          console.log('Playing Web Audio API from cache')
          this.sources[0].buffer = buffer
          this.sources[0].start()
          this.playMode = PLAY_MODE_WEBAUDIO
        })
      })
      .catch(() => {
        this.html5Audio.src = url
        this.html5Audio.play()
        this.playMode = PLAY_MODE_HTML5
        this.state = STATE_PLAY
        this.loadTrack(id, url)
          .then(this.switchToWebAudio)
          .catch(e => {
            console.log(e)
          })
      })
  }

  /* == pauses playback
  //
  //   determine playback type and pause / stop
  //
  */
  pause () {
    if (this.playMode === false) {
      return
    } else if (this.playMode === PLAY_MODE_HTML5) {
      this.html5Audio.pause()
    } else if (this.playMode === PLAY_MODE_WEBAUDIO) {
      this.sources[0].stop()
    }
    this.paused = true
  }

  enqueueOne ({ id, url }) {
    id = parseInt(id) || false
    url = url || false
    if (id !== false && url !== false) {
      this.queue.push({ id: id, url: url })
      if (this.queuePos === -1) {
        this.queuePos = 0
      }
    }
  }

  enqueue (tracks) {
    if (Array.isArray(tracks)) {
      tracks.forEach(t => this.enqueueOne(t))
    }
  }
}
