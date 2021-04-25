import { LocalPlayer } from '../src/player.js'



/*
const ko = window.ko



// use this so we don't get flashes as the correct page loads...
const vmBlank = function (params) {
}
ko.components.register('blank', {
  viewModel: vmBlank,
  template: '<div></div>'
})

// login view model
const vmLogin = function (params) {
  this.username = ko.observable('')
  this.password = ko.observable('')
  this.loginError = ko.observable('')
  this.login = () => {
    const body = JSON.stringify({ username: this.username(), password: this.password() })
    window.fetch('/api/login', { method: 'post', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
      .then(response => response.json())
      .then(data => {
        if (data.state === 'failed' || data.state === false) {
          // show a message that login failed
          this.loginError('Invalid username and/or password')
        } else {
          params.mainContainer('app')
        }
      })
      .catch(err => {
        console.log(err)
      })
  }
  this.enterCheck = (o, e) => {
    const kc = e.keyCode
    if (kc === 13) {
      this.login()
    }
  }
}
ko.components.register('login', {
  viewModel: vmLogin,
  template: { element: 't-login' }
})

// welcome view model
const vmWelcome = function (params) {
  this.username = 'admin'
  this.password = ko.observable('')
  this.vpassword = ko.observable('')
  this.passwordMessage = ko.observable('')
  this.vpasswordMessage = ko.observable('')
  this.setPassword = function () {
    let err = false
    let pwm = ''
    let vpm = ''
    if (this.password().length < 8) {
      pwm = 'Passwords must be at least 8 characters long'
      err = true
    }
    if (this.password() !== this.vpassword()) {
      vpm = 'Passwords do not match'
      err = true
    }
    if (err) {
      this.passwordMessage(pwm)
      this.vpasswordMessage(vpm)
      return
    }
    this.vpasswordMessage('')
    const body = JSON.stringify({ username: this.username, password: this.password() })
    window.fetch('/api/welcome', { method: 'post', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
      .then(response => response.json())
      .then((data) => {
        if (data.state) {
          params.mainContainer('login')
        } else {
          // no reason we should actually get here, only if someone's trying to hack us...
          console.log('failed... nice try')
        }
      })
  }
}
ko.components.register('welcome', {
  viewModel: vmWelcome,
  template: { element: 't-welcome' }
})

const vmApp = function (params) {
  const self = this

  self.pageContainer = ko.observable('t-home')

  // set the page title
  self.pageTitle = ko.observable('FALK')
  self.pageTitle.subscribe(function (newTitle) {
    if (!self.playing.state()) {
      document.title = newTitle
    }
  })

  // tiles holds the list of tiles to show (null means no tiles)
  self.tiles = ko.observableArray([])
  // this holds information about the current album (null means information is hidden)
  self.album = ko.observable(null)

  // queue observables
  self.queue = {
    list: ko.observableArray([]),
    pos: ko.observable(0),
    // trigger: true,
    remove: (song) => {
      self.queue.list().forEach((s, i) => {
        // find the song in the queue
        if (s._id === song._id) {
          // remove the item from the queue
          self.queue.list.splice(i, 1)
          if (i < self.queue.pos()) {
            // if the song is before the current playing position, turn off the trigger and decrement
            // self.queue.trigger = false
            self.queue.pos(self.queue.pos() - 1)
          }
        }
      })
    },
    save: () => {
      // const _q = { tracks: self.queue.list(), pos: self.queue.pos() }
      // window.localStorage.setItem('queue', JSON.stringify(_q))
    },
    restore: () => {

      //const _l = null // window.localStorage.getItem('queue')
      //if (_l && typeof _l === 'string' && _l !== '') {
      //  const _q = JSON.parse(_l)
      //  _q.tracks.forEach((s, i) => { s.playing = ko.observable(i === _q.pos) })
      //  self.queue.list(_q.tracks)
      //  self.queue.pos(_q.pos)
      //  self.player._playQueue(false)
      //}
    }
  }
  // sets the UI queue to show the correct song playing
  self.queue.pos.subscribe(function (qp) {
    self.queue.list().forEach((s, i) => {
      s.playing(i === qp)
    })
  })

  // information about the playing song (and it's state)
  self.playing = {
    state: ko.observable(false),
    title: ko.observable('Not playing'),
    artist: ko.observable('Select some music!'),
    album: ko.observable(''),
    art: ko.observable('/art/placeholder.png'),
    discart: ko.observable(null),
    duration: ko.observable(0),
    elapsed: ko.observable(0),
    quality: ko.observable(''), <!--  -->
    update: () => {
      const song = self.queue.list()[self.queue.pos()]

      self.playing.title(song.title)
      self.playing.artist(song.artist)
      self.playing.album(song.album)
      self.playing.duration(song.duration)
      self.playing.art('/art/' + song.art.cover)
      self.playing.discart(((so
  // clear queue and play a single song
  // self.clearPlaySong = song => {
  //   song = song || null
  //   self.queue.list([song])
  //   self.playSong(song)
  // }

  // clear queue and play a whole album
  // self.clearPlayAlbum = () => {
  //   self.queue.list(self.album.tracks)
  //   self.playSong(self.queue.list[0])
  // }ng.art.disc !== '') ? '/art/' + song.art.disc : null))
      self.playing.quality(song.shortformat)

      if ('mediaSession' in navigator) {
        const fullart = window.location.origin + '/art/' + song.art.cover
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: song.title,
          artist: song.artist,
          album: song.album,
          artwork: [
            { src: fullart, sizes: '1000x1000', type: 'image/jpg' }
            // { src: 'https://dummyimage.com/128x128', sizes: '128x128', type: 'image/png' },
            // { src: 'https://dummyimage.com/192x192', sizes: '192x192', type: 'image/png' },
            // { src: 'https://dummyimage.com/256x256', sizes: '256x256', type: 'image/png' },
            // { src: 'https://dummyimage.com/384x384', sizes: '384x384', type: 'image/png' },
            // { src: 'https://dumm2yimage.com/512x512', sizes: '512x512', type: 'image/png' },
          ]
        })
      }

      document.title = song.title + ' - ' + song.albumartist + ' | FALK'
    }
  }

  // playback control

  // clear queue and play album, from specific song
  self.playAlbumSong = song => {
    const tracks = self.album().tracks
    // append a "playing" observable to each track
    let pos
    tracks.forEach((e, i) => {
      e.playing = ko.observable(e._id === song._id)
      pos = ((e._id === song._id) ? i : pos)
    })
    self.player.setTracks(tracks, pos)
  }

  self.player = {
    audio: null,
    progress: ko.observable(0),
    _get: () => {
      if (self.player.audio === null) {
        self.player.audio = new LocalPlayer()
        self.player.audio.on('play', self.player.evtHandlers.play)
        self.player.audio.on('pause', self.player.evtHandlers.pause)
        self.player.audio.on('next', self.player.evtHandlers.next)
        self.player.audio.on('progress', self.player.evtHandlers.update)
      }
    },
    evtHandlers: {
      complete: () => {
        self.playing.state(false)
        if (self.queue.pos() < self.queue.list().length - 1) {
          self.queue.pos(self.queue.pos() + 1)
        }
      },
      update: (evt) => {
        const detail = evt.detail
        // update the progress
        self.player.progress(detail.elapsed / detail.duration * window.innerWidth)
        // set the elapsed value
        self.playing.elapsed(Math.floor(detail.elapsed))
      },
      play: () => {
        self.playing.state(true)
        self.playing.update()
      },
      pause: () => {
        self.playing.state(false)
      },
      next: () => {
        self.queue.pos(self.queue.pos() + 1)
        self.playing.update()
      }
    },
    prev: () => {
      if (self.queue.pos() > 0) {
        self.queue.pos(self.queue.pos() - 1)
      }
    },
    setQueuePos: (song) => {
      console.log(song)
      const p = self.queue.list().findIndex(s => s._id === song._id)
      console.log(p)
      self.queue.pos(p)
      self.player.audio.changePos(p)
    },
    next: () => {
      // this triggers a 'next' event, and is handled above
      self.player.audio.skip()
    },
    toggle: () => {
      if (self.player.audio.isPlay()) {
        self.player.audio.pause()
      } else {
        self.player.audio.play()
      }
    },
    play: () => {
      self.player.audio.play()
    },
    pause: () => {
      self.player.audio.pause()
    },
    setTracks: (tracks, pos = 0) => {
      self.player.progress(0)
      self.queue.list(tracks)
      self.queue.pos(pos)
      const tr = tracks.map((e, i) => {
        return {
          id: e._id,
          url: '/song/' + e._id + e.location.substr(e.location.lastIndexOf('.'))
        }
      })
      self.player.audio.setTracks(tr, pos, true)
      // self.player.audio.updateTracks(...tracks)
      // if (play) {
      //   self.player.play()
      // }
      // self.queue.save()
    },
    enqueue: (tracks) => {

    }
  }
  self.player._get()

  // playback control ends

  self.stats = {
    songs: ko.observable(0),
    albums: ko.observable(0),
    artists: ko.observable(0)
  }

  self.menuState = ko.observable(false)
  self.showMenu = function () {
    self.menuState(true)
  }

  self.settings = {
    isAdmin: ko.observable(false),
    locations: {
      list: ko.observableArray([]),
      add: (e) => {
        const body = JSON.stringify({ location: self.settings.directories.location() })
        window.fetch('/api/locations', { method: 'post', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
          .then(response => response.json())
          .then(data => {
            // returns a list of locations, so let's update that
            self.settings.locations.list(data)
          })
      },
      remove: (e) => {
        const body = JSON.stringify({ location: e })
        window.fetch('/api/locations', { method: 'delete', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
          .then(response => response.json())
          .then(data => {
            // returns a list of locations, so let's update that
            self.settings.locations.list(data)
          })
      }
    },
    directories: {
      location: ko.observable(''),
      list: ko.observableArray([]),
      load: function (e) {
        let next
        const curLocation = self.settings.directories.location()
        // case for when nothing is provided (initial load)
        if (e === '') {
          next = ''
        // case for when someone clicks the "up" button (..)
        } else if (e.name === '..') {
          next = curLocation.substr(0, curLocation.lastIndexOf('/'))
          if (next === '') {
            next = '/'
          }
        // anything else (they clicked a directory)
        } else {
          if (curLocation === '/') {
            next = '/' + e.name
          } else {
            next = curLocation + '/' + e.name
          }
        }
        // create body
        const body = JSON.stringify({ location: next })
        // make request
        window.fetch('/api/directories', { method: 'post', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
          .then(response => response.json())
          .then(data => {
            // update variables
            self.settings.directories.location(data.location)
            self.settings.directories.list(data.directories)
          })
      }
    },
    database: {
      update: function () {
        const url = '/api/update'
        window.fetch(url)
          .catch(err => {
            console.log(err)
          })
      }
    },
    users: {
      list: ko.observableArray([]),
      remove: function (user) {
        const body = JSON.stringify({ uuid: user.uuid })
        window.fetch('/api/users', { method: 'delete', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
          .then(response => response.json())
          .then(data => {
            // update variables
            self.settings.users.list(data)
          })
      },
      add: {
        name: ko.observable(''),
        password: ko.observable(''),
        vpassword: ko.observable(''),
        admin: ko.observable(false),
        inherit: ko.observable(false),
        error: ko.observable(''),
        visible: ko.observable(false),
        setVisible: function () { self.settings.users.add.visible(true) },
        unsetVisible: function () {
          self.settings.users.add.visible(false)
          self.settings.users.add.name('')
          self.settings.users.add.password('')
          self.settings.users.add.vpassword('')
          self.settings.users.add.inherit(false)
          self.settings.users.add.admin(false)
          self.settings.users.add.error('')
        },
        process: function () {
          if (self.settings.users.add.name().length > 0 && self.settings.users.add.password().length > 7 && self.settings.users.add.password() === self.settings.users.add.vpassword()) {
            const body = JSON.stringify({ user: self.settings.users.add.name(), pass: self.settings.users.add.password(), admin: self.settings.users.add.admin(), inherit: self.settings.users.add.inherit() })
            window.fetch('/api/users', { method: 'post', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
              .then(response => response.json())
              .then(data => {
                self.settings.users.list(data)
                // self.settings.users.add.visible(false)
                self.settings.users.add.unsetVisible()
              })
          } else {
            if (self.settings.users.add.password().length < 8) {
              self.settings.users.add.error('Password too short')
            } else if (self.settings.users.add.password() !== self.settings.users.add.vpassword()) {
              self.settings.users.add.error('Passwords don\'t match')
            } else {
              self.settings.users.add.error('You must supply a username')
            }
          }
        }
      }
    }
  }

  self.queueVisible = ko.observable(false)
  self.showQueue = function (el) {
    self.queueVisible(true)
  }
  self.toggleQueue = function (el) {
    self.queueVisible(!(self.queueVisible()))
  }
  self.menuToggle = function (el) {
    self.menuState(!(self.menuState()))
  }
  self.menuShow = function (el) {
    self.menuState(true)
  }
  self.menuHide = function (el) {
    self.menuState(false)
  }

  // this is called when a new link is added to the page (these are manual!)
  self.updateLinks = function () {
    self.router.updatePageLinks()
  }

  self.buildRoutes = () => {
    self.router = new window.Navigo('/', { hash: true })
    self.router
      .hooks({
        after (match) {
          self.menuState(false)
        }
      })
      .on('/', () => {
        self.tiles([])
        self.pageTitle('Home')
        self.pageContainer('t-home')
      }, {
        before: (done) => {
          document.body.classList.add('no-controls')
          done()
        },
        leave: (done) => {
          document.body.classList.remove('no-controls')
          done()
        }
      })
      .on('/playlists', () => {
        self.pageTitle('Playlists')
        self.tiles([])
        self.pageContainer('t-tiles')
      })
      .on('/artists', () => {
        self.data.getArtists()
          .then(data => {
            if (data.length > 0) {
              self.tiles(data)
              self.pageTitle('Artists')
              self.pageContainer('t-tiles')
            } else {
              // nothing in the library!
            }
          })
      })
      .on('/artist/:artist', (params) => {
        const artist = params.data.artist
        self.data.getArtist(artist)
          .then(data => {
            if (data.albums.length > 0) {
              self.tiles(data.albums)
              self.pageTitle(artist)
              self.pageContainer('t-artist')
            }
          })
      })
      .on('/albums', () => {
        self.data.getAlbums()
          .then(data => {
            if (data.length > 0) {
              self.tiles(data)
              self.pageTitle('Albums')
              self.pageContainer('t-tiles')
            }
          })
      })
      .on('/album/:artist/:album', (params) => {
        const artist = params.data.artist
        const album = params.data.album

        self.data.getAlbum(artist, album)
          .then(data => {
            self.album(data)
            self.pageTitle(album + ' - ' + artist)
            self.pageContainer('t-album')
            self.tiles([])
          })
      }, {
        leave: (done) => {
          self.album(null)
          done()
        }
      })
      .on('/genres', () => {
        self.data.getGenres()
          .then(data => {
            if (data.length > 0) {
              self.tiles(data)
              self.pageTitle('Genres')
              self.pageContainer('t-tiles')
            }
          })
      })
      .on('/genre/:genre', (params) => {
        const genre = params.data.genre
        self.data.getGenre(genre)
          .then(data => {
            if (data.length > 0) {
              self.tiles(data)
              self.pageTitle(genre)
              self.pageContainer('t-tiles')
            }
          })
      })
      .on('/settings', () => {
        self.pageTitle('Settings')
        self.tiles([])
        self.pageContainer('t-settings')
        // load the directory browser
        self.settings.directories.load('')
        // get the current directories
        window.fetch('/api/locations')
          .then(response => response.json())
          .then(data => {
            self.settings.locations.list(data.locations)
            self.settings.isAdmin(data.admin)
          })
        // update the stats (in case the library has changd)
        self.data.getStats()
          .then(data => {
            self.stats.songs(data.songs)
            self.stats.albums(data.albums)
            self.stats.artists(data.artists)
          })
        // get users (if we're an admin)
        if (self.settings.isAdmin) {
          window.fetch('/api/users')
            .then(response => response.json())
            .then(data => {
              self.settings.users.list(data)
            })
        }
      })
      .on('/logout', () => {
        window.fetch('/api/logout')
          .then(() => {
            window.location.href = '/'
          })
      })
      .resolve()
  }

  // inituialize the database and then load the routes (prevents pages loading before the database is ready)
  self.data = new DatabaseHandler(self.buildRoutes)
  self.events = new window.EventSource('/events')
  self.events.onmessage = (evt) => {
    const eventData = JSON.parse(evt.data)
    console.log(evt.data)
    console.log(eventData)
  }
  self.events.addEventListener('update', (evt) => {
    const data = JSON.parse(evt.data)
    console.log(data)
    if (data.status === 'started') {
      // do some stuff
      console.log('server updating')
    } else if (data.status === 'complete') {
      self.data.update(() => {
        self.data.getStats()
          .then(data => {
            self.stats.songs(data.songs)
            self.stats.albums(data.albums)
            self.stats.artists(data.artists)
          })
      })
    }
  })
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', self.player.play)
    navigator.mediaSession.setActionHandler('pause', self.player.pause)
    navigator.mediaSession.setActionHandler('previoustrack', self.player.prev)
    navigator.mediaSession.setActionHandler('nexttrack', self.player.next)
  }
  self.queue.restore()
}
ko.components.register('app', {
  viewModel: vmApp,
  template: { element: 't-app' }
})

// app page model
function AppViewModel () {
  const self = this

  self.mainContainer = ko.observable('blank')

  window.fetch('/api/check')
    .then(response => {
      if (response.status === 200) {
        self.mainContainer('app')
        window.localStorage.setItem('loggedIn', 'true')
      } else if (response.status === 403) {
        self.mainContainer('login')
        window.localStorage.setItem('loggedIn', 'false')
      } else {
        self.mainContainer('welcome')
        window.localStorage.setItem('loggedIn', 'false')
      }
    })
    .catch(() => {
      if (window.localStorage.getItem('loggedIn') === 'true') {
        self.mainContainer('app')
      }
      // else we need to show a "you must be connected" screen
    })
}

const hammerEvents = ['tap', 'doubletap', 'hold', 'rotate', 'drag', 'dragstart', 'dragend', 'dragleft', 'dragright', 'dragup', 'dragdown', 'transform', 'transformstart', 'transformend', 'swipe', 'swipeleft', 'swiperight', 'swipeup', 'swipedown', 'pinch', 'pinchin', 'pinchout']
ko.utils.arrayForEach(hammerEvents, function (eventName) {
  ko.bindingHandlers[eventName] = {
    init: function (element, valueAccessor) {
      const hammer = new window.Hammer(element)
      hammer.get('swipe').set({ direction: window.Hammer.DIRECTION_ALL })
      const value = valueAccessor()
      hammer.on(eventName, function (e) {
        value(e)
      })
    }
  }
})

indexedDB.open('falk', 2).onupgradeneeded = function (e) {
  const store = e.target.result.createObjectStore('cache', { keyPath: 'id' })
  store.createIndex('date', 'added')
}

ko.applyBindings(new AppViewModel())

// hide any visible dropdown if someone clicks on the body
document.body.addEventListener('click', (e) => {
  if (e.target.closest('div') === null || !e.target.closest('div').classList.contains('dropdown')) {
    document.querySelectorAll('div.dropdown').forEach(function (f) {
      f.classList.remove('is-active')
    })
  }
})

if (navigator.serviceWorker) {
  navigator.serviceWorker.register('serviceworker.js')
}
*/
