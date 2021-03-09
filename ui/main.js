const ko = window.ko

class DatabaseHandler {
  constructor (callback) {
    this.db = new loki ('falkns0113.db', {
      autoload: true,
      autoloadCallback: async () => {
        // load the collection (or create if it's empty)
        this.music = this.db.getCollection('songs')
        if (!this.music) {
          this.music = this.db.addCollection('songs', { unique: ['id'] })
        }
        // load the collection (or create if it's empty)
        this.artists = this.db.getCollection('artists')
        if (!this.artists) {
          this.artists = this.db.addCollection('artists', { unique: ['name'] })
        }
        //  if there's at least some music, call the callback
        // if (this.music.count() > 0 && typeof callback === 'function') {
        //   callback()
        //   this.update()
        // } else {
        //   // otherwise we might as well load the database before we begin
        this.update(callback)
        // }
      },
      autosave: true,
      autosaveInterval: 4000
    })
  }

  async update (callback) {
    // load the data from the API (needs some error handling)
    let data = await window.fetch('/api/songs/all')
    data = await data.json()

    // add the songs to the database
    data.data.forEach(s => {
      this.addSong(s)
    })

    // pull the remaining songs from the API, using the limit provided by the API
    let remain = data.remain
    const limit = data.data.length

    let offset = limit
    while (remain > 0) {
      data = await window.fetch('/api/songs/all/' + offset + '/' + limit)
      data = await data.json()
      data.data.forEach(s => {
        this.addSong(s)
      })

      remain = data.remain
      offset = offset + limit
    }

    if (callback !== undefined) {
      callback()
    }
  }

  addSong (song) {
    try {
      // get the song from the database using the index (very fast!)
      const dbSong = this.music.get(song.$loki) || null
      // if the song isn't in the database
      if (dbSong === null) {
        // simply insert it, then correct the ID and metadata as sent by the server
        const s = this.music.insert({ info: song.info, favorite: song.favorite, playCount: song.playCount, cached: false })
        s.$loki = song.$loki
        s.meta = song.meta
        this.music.update(s)
      } else {
        // the song already exists, let's check if the metadata has changed
        if (JSON.stringify(dbSong.info) !== JSON.stringify(song.info)) {
          // info has changed, update
          dbSong.info = song.info
          this.music.update(dbSong)
          // now we need to check to see if the other data has changed... <----------------------------------------------------------
        }
      }
    } catch (e) {
      console.error('Could not add song to database')
    }

    try {
      const artist = this.artists.by('name', song.info.albumartist) || null
      const curart = ((artist !== null) ? artist.art || null : null)
      if (artist === null) {
        this.artists.insert({ name: song.info.albumartist, art: song.info.art.artist })
      } else if (song.info.art.artist !== '') {
        if (curart === null) {
          artist.art = song.info.art.artist
          this.artists.update(artist)
        }
      }
    } catch (e) {
      console.log('Could not add artist')
      console.log(e)
    }
  }

  async getStats () {
    const ret = { songs: 0, albums: 0, artists: 0 }
    const allSongs = this.music.find()
    ret.songs = allSongs.length
    ret.artists = [...new Set(allSongs.map(song => song.info.albumartist))].length
    ret.albums = [...new Set(allSongs.map(song => song.info.album))].length
    return ret
  }

  async getArtists () {
    const artists = this.artists.find()
    return artists.map(a => { return { title: a.name, art: '/art/' + ((a.art !== '') ? a.art : 'placeholder.png'), url: `/artist/${encodeURIComponent(a.name)}`, subtitle: '', surl: '' } })
  }

  async getArtist (artist) {
    const songs = this.music.chain().find({ 'info.albumartist': artist }).simplesort('info.year').data()
    const albums = songs.map(e => {
      return {
        art: '/art/' + e.info.art.cover,
        title: e.info.album,
        url: `/album/${encodeURIComponent(e.info.albumartist)}/${encodeURIComponent(e.info.album)}`,
        subtitle: e.info.year,
        surl: ''
      }
    }).filter((tag, index, array) => array.findIndex(t => t.title === tag.title && t.subtitle === tag.subtitle) === index)
    return { albums: albums }
  }

  async getAlbums () {
    const songs = this.music.chain().find().simplesort('info.album').data()
    const albums = songs.map(e => {
      return {
        art: '/art/' + e.info.art.cover,
        title: e.info.album,
        url: `/album/${encodeURIComponent(e.info.albumartist)}/${encodeURIComponent(e.info.album)}`,
        subtitle: e.info.albumartist,
        surl: `/artist/${encodeURIComponent(e.info.albumartist)}`
      }
    }).filter((tag, index, array) => array.findIndex(t => t.title === tag.title && t.subtitle === tag.subtitle) === index)
    return albums
  }

  async getAlbum (artist, album) {
    const data = this.music.chain().find({ 'info.albumartist': artist, 'info.album': album }).compoundsort(['info.disc', 'info.track']).data()
    const info = data.map(s => {
      s.info._id = s.$loki
      s.info.shortformat = (s.info.format.samplerate / 1000) + 'kHz ' + ((s.info.format.bits) ? s.info.format.bits + 'bit' : '')
      s.info.artist = ((s.info.artists.length > 0) ? s.info.artists[0] : s.info.albumartist)
      return s.info
    })
    console.log(info)
    return {
      title: info[0].album,
      art: '/art/' + info[0].art.cover,
      artist: info[0].albumartist,
      year: info[0].year,
      genre: info[0].genre,
      shortformat: info[0].shortformat,
      tracks: info
    }
  }

  async getGenres () {
    const songs = this.music.chain().find().simplesort('info.genre').data()
    const genres = songs.map(e => {
      return {
        art: '/art/' + e.info.art.cover,
        title: e.info.genre,
        url: `/genre/${encodeURIComponent(e.info.genre)}`,
        subtitle: '',
        surl: ''
      }
    }).filter((tag, index, array) => array.findIndex(t => t.title === tag.title && t.title !== '') === index)
    return genres
  }

  async getGenre (genre) {
    const songs = this.music.chain().find({ 'info.genre': genre }).simplesort('info.album').data()
    const albums = songs.map(e => {
      return {
        art: '/art/' + e.info.art.cover,
        title: e.info.album,
        url: `/album/${encodeURIComponent(e.info.albumartist)}/${encodeURIComponent(e.info.album)}`,
        subtitle: e.info.albumartist,
        surl: `/artist/${encodeURIComponent(e.info.albumartist)}`
      }
    }).filter((tag, index, array) => array.findIndex(t => t.title === tag.title && t.subtitle === tag.subtitle) === index)
    return albums
  }
}

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

  // quick link to the audio player
  self.audio = document.getElementById('audio-player')

  self.stats = {
    songs: ko.observable(0),
    albums: ko.observable(0),
    artists: ko.observable(0)
  }

  // queue observables
  self.queue = {
    list: ko.observableArray([]),
    pos: ko.observable(0),
    trigger: true,
    changePos: (song) => {
      self.queue.list().forEach((s, i) => {
        if (s._id === song._id) {
          self.queue.pos(i)
        }
      })
    },
    remove: (song) => {
      self.queue.list().forEach((s, i) => {
        // find the song in the queue
        if (s._id === song._id) {
          // remove the item from the queue
          self.queue.list.splice(i, 1)
          if (i < self.queue.pos()) {
            // if the song is before the current playing position, turn off the trigger and decrement
            self.queue.trigger = false
            self.queue.pos(self.queue.pos() - 1)
          }
        }
      })
    }
  }
  self.queue.pos.subscribe(function (qp) {
    if (self.queue.trigger) {
      self.play()
    } else {
      // we didn't trigger, but we'll need to next time
      self.queue.trigger = true
    }
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
    duration: ko.observable(0),
    elapsed: ko.observable(0),
    quality: ko.observable('')
  }

  /* playback control */
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
  // }

  // clear queue and play album, from specific song
  self.playAlbumSong = song => {
    const tracks = self.album().tracks
    // append a "playing" observable to each track
    tracks.forEach(e => { e.playing = ko.observable(false) })
    self.queue.list(tracks)

    self.queue.list().forEach((s, i) => {
      if (s._id === song._id) {
        self.queue.pos(i)
        s.playing(true)
      }
    })

    self.play()
  }

  // play the song at queue.pos
  self.play = () => {
    const song = self.queue.list()[self.queue.pos()]
    console.log(song)
    const ext = song.location.substr(song.location.lastIndexOf('.'))
    const url = `/api/stream/${song._id}${ext}`
    console.log(url)
    self.audio.src = url

    self.playing.title(song.title)
    self.playing.artist(song.artist)
    self.playing.album(song.album)
    self.playing.duration(song.duration)
    self.playing.art('/art/' + song.art.cover)
    self.playing.quality(song.shortformat)

    if ('mediaSession' in navigator) {
      const fullart = window.location.origin + '/' + song.art.cover
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: self.playing.title(),
        artist: self.playing.artist(),
        album: self.playing.album(),
        artwork: [
          { src: fullart, sizes: '1000x1000', type: 'image/jpg' }
          // { src: 'https://dummyimage.com/128x128', sizes: '128x128', type: 'image/png' },
          // { src: 'https://dummyimage.com/192x192', sizes: '192x192', type: 'image/png' },
          // { src: 'https://dummyimage.com/256x256', sizes: '256x256', type: 'image/png' },
          // { src: 'https://dummyimage.com/384x384', sizes: '384x384', type: 'image/png' },
          // { src: 'https://dummyimage.com/512x512', sizes: '512x512', type: 'image/png' },
        ]
      })
    }

    document.title = song.title + ' - ' + song.albumartist + ' | FALK'
  }
  self.playPrev = () => {
    if (self.queue.pos() > 0) {
      self.queue.pos(self.queue.pos() - 1)
    }
  }
  self.playNext = () => {
    if (self.queue.pos() < self.queue.list().length - 1) {
      self.queue.pos(self.queue.pos() + 1)
    } else {
      self.playStop()
    }
  }
  self.playStop = () => {
    self.audio.src = ''
  }

  self.togglePlay = () => {
    if (self.audio.paused) {
      self.audio.play()
    } else {
      self.audio.pause()
    }
  }

  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', self.togglePlay)
    navigator.mediaSession.setActionHandler('pause', self.togglePlay)
    navigator.mediaSession.setActionHandler('previoustrack', self.playPrev)
    navigator.mediaSession.setActionHandler('nexttrack', self.playNext)
  }

  self.player = {
    complete: () => {
      self.playing.state(false)
      if (self.queue.pos() < self.queue.list().length - 1) {
        self.queue.pos(self.queue.pos() + 1)
      }
    },
    update: () => {
      self.playing.elapsed(Math.ceil(self.audio.currentTime))
    },
    play: () => {
      self.playing.state(true)
    },
    pause: () => {
      self.playing.state(false)
    }
  }
  /* playback control ends */

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
      rescan: function () {
        // do some stuff
      },
      update: function () {
        const url = '/api/' + ((self.settings.database.rescan()) ? 'rescan' : 'update')
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
    self.router = new window.Navigo('/')
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
              self.pageContainer('t-tiles')
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
            console.log(data)
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
      } else if (response.status === 403) {
        self.mainContainer('login')
      } else {
        self.mainContainer('welcome')
      }
    })
    .catch(() => { /* do nothing */ })
}

const events = ['tap', 'doubletap', 'hold', 'rotate', 'drag', 'dragstart', 'dragend', 'dragleft', 'dragright', 'dragup', 'dragdown', 'transform', 'transformstart', 'transformend', 'swipe', 'swipeleft', 'swiperight', 'swipeup', 'swipedown', 'pinch', 'pinchin', 'pinchout']
ko.utils.arrayForEach(events, function (eventName) {
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
