const ko = window.ko

// use this so we don't get flashes as the proper page loads...
ko.components.register('blank', {
  viewModel: () => {},
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
        if (data.state === 'failed') {
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
  // quick link to the audio player
  self.audio = document.getElementById('audio-player')

  self.stats = {
    songs: ko.observable(0),
    albums: ko.observable(0),
    artists: ko.observable(0),
    update: function () {
      window.fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
          self.stats.songs(data.songs)
          self.stats.albums(data.albums)
          self.stats.artists(data.artists)
        }).catch(err => {
          console.log(err)
        })
    }
  }
  self.stats.update()

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
    trigger: true,
    changePos: (song) => {
      // console.log(song.id)
      self.queue.list().forEach((s, i) => {
        if (s._id === song._id) {
          self.queue.pos(i)
        //  s.playing(true)
        }// else {
        //  s.playing(false)
        // }
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
    artist: ko.observable(''),
    album: ko.observable(''),
    art: ko.observable('/art/placeholder.png'),
    duration: ko.observable(0),
    elapsed: ko.observable(0)
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
    self.queue.list(self.album().tracks)

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

    const id = song._id
    const ext = song.location.substr(song.location.lastIndexOf('.'))
    const url = `/api/stream/${id}${ext}`
    self.audio.src = url

    self.playing.title(song.title)
    self.playing.artist(song.albumartist)
    self.playing.duration(song.duration)
    self.playing.art(song.art)

    if ('mediaSession' in navigator) {
      const fullart = window.location.origin + song.art
      console.log(fullart)
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: self.playing.title,
        artist: self.playing.artist,
        album: self.playing.album,
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
      rescan: ko.observable(false),
      update: function () {
        const url = '/api/' + ((self.settings.database.rescan()) ? 'rescan' : 'update')
        console.log(url)
        window.fetch(url)
          .catch(err => {
            console.log(err)
          })
      }
    }
  }

  // this is called when a new link is added to the page (these are manual!)
  self.updateLinks = function () {
    self.router.updatePageLinks()
  }

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
      window.fetch('/api/artists')
        .then(response => response.json())
        .then(data => {
          if (data.length > 0) {
            data.forEach(e => {
              e.title = e.artist,
              e.url = `/artist/${encodeURIComponent(e.artist)}`,
              e.subtitle = '',
              e.surl = ''
            })
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
      window.fetch('/api/artist/' + encodeURIComponent(artist))
        .then(response => response.json())
        .then(data => {
          if (data.length > 0) {
            data.forEach(e => {
              e.title = e.album,
              e.url = `/album/${encodeURIComponent(e.albumartist)}/${encodeURIComponent(e.album)}`,
              e.subtitle = e.year,
              e.surl = ''
            })
            self.tiles(data)
            self.pageTitle(artist)
            self.pageContainer('t-tiles')
          } else {
            // nothing in the library!
          }
        })
    })
    .on('/album/:artist/:album', (params) => {
      const artist = params.data.artist
      const album = params.data.album
      window.fetch(`/api/album/${encodeURIComponent(artist)}/${encodeURIComponent(album)}`)
        .then(response => response.json())
        .then(data => {
          data.tracks.forEach(e => {
            // e.title = e.track + '. ' + e.title
            e.shortformat = (e.format.samplerate / 1000) + 'kHz ' + ((e.format.bits) ? e.format.bits + 'bit' : '')
            e.playing = ko.observable(false)
          })
          if (data.tracks.length > 0) {
            data.year = data.tracks[0].year
            data.genre = data.tracks[0].genre
            data.shortformat = ((data.tracks.every((i) => i.shortformat === data.tracks[0].shortformat)) ? data.tracks[0].shortformat : 'Mixed')
          }
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
    .on('/albums', () => {
      window.fetch('/api/albums')
        .then(response => response.json())
        .then(data => {
          if (data.length > 0) {
            data.forEach(e => {
              e.title = e.album,
              e.url = `/album/${encodeURIComponent(e.albumartist)}/${encodeURIComponent(e.album)}`,
              e.subtitle = e.albumartist,
              e.surl = `/artist/${encodeURIComponent(e.albumartist)}`
            })
            self.tiles(data)
            self.pageTitle('Albums')
            self.pageContainer('t-tiles')
          } else {
            // nothing in the library!
          }
        })
    })
    .on('/genres', () => {
      window.fetch('/api/genres')
        .then(response => response.json())
        .then(data => {
          if (data.length > 0) {
            const arr = data.map(e => {
              return {
                title: e,
                art: '/art/genre.jpg',
                url: `/genre/${encodeURIComponent(e)}`,
                subtitle: '',
                surl: ''
              }
            })
            self.tiles(arr)
            self.pageTitle('Genres')
            self.pageContainer('t-tiles')
          } else {
            // nothing in the library!
          }
        })
    })
    .on('/genre/:genre', (params) => {
      const genre = params.data.genre
      window.fetch('/api/genre/' + genre)
        .then(response => response.json())
        .then(data => {
          if (data.length > 0) {
            data.forEach(e => {
              e.title = e.album,
              e.url = `/album/${encodeURIComponent(e.albumartist)}/${encodeURIComponent(e.album)}`,
              e.subtitle = e.albumartist,
              e.surl = `/artist/${encodeURIComponent(e.albumartist)}`
            })
            self.tiles(data)
            self.pageTitle(genre)
            self.pageContainer('t-tiles')
          } else {
            // nothing in the library!
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
          self.settings.locations.list(data)
        })
      // update the stats (in case the library has changd)
      window.fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
          self.stats.songs = data.songs
          self.stats.albums = data.albums
          self.stats.artists = data.artists
        })
    })
    .on('/logout', () => {
      window.fetch('/api/logout')
        .then(() => {
          window.location.href = '/'
        })
    })
    .resolve()
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

ko.applyBindings(new AppViewModel())

// hide any visible dropdown if someone clicks on the body
document.body.addEventListener('click', (e) => {
  if (e.target.closest('div') === null || !e.target.closest('div').classList.contains('dropdown')) {
    document.querySelectorAll('div.dropdown').forEach(function (f) {
      f.classList.remove('is-active')
    })
  }
})
