//tiles view model
function vmTiles (params) {
  this.tiles = params.tiles
  this.title = params.title
}
ko.components.register('tiles', {
  viewModel: vmTiles,
  template: { element: 't-tiles' }
})

//each tile model
function vmTile (params) {
  this.title = params.title
  this.art = params.art
  this.url = params.url
  this.subtitle = params.subtitle
  this.surl = params.surl
}
ko.components.register('tile', {
  viewModel: vmTile,
  template: { element: 't-tile' }
})

//album view model
const vmAlbum = function (params) {
  this.album = params.album()
  this.tracks = this.album.tracks()
}
ko.components.register('album', {
  viewModel: vmAlbum,
  template: { element: 't-album' }
})

//app page model
function AppViewModel() {
    var self = this
    
    //quick link to the audio player
    self.audio = document.getElementById('audio-player')

    //set the page title
    self.pageTitle = ko.observable('FALK')
    self.pageTitle.subscribe(function(newTitle) {
      if (!self.playing.state()) {
        document.title = newTitle
      }
    })

    //tiles holds the list of tiles to show (null means no tiles)
    self.tiles = ko.observable([])
    //this holds information about the current album (null means information is hidden)
    self.album = ko.observable(null)

    //queue observables
    self.queue = ko.observable([])
    self.queuePos = ko.observable(0)
    self.queuePos.subscribe(function(qp) {
      self.play()
      self.queue().forEach((s, i) => {
        s.playing(i === qp)
      })
    })

    //information about the playing song (and it's state)
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
    //self.clearPlaySong = song => {
    //  song = song || null
    //  self.queue([song])
    //  self.playSong(song)
    //}

    //clear queue and play a whole album
    //self.clearPlayAlbum = () => {
    //  self.queue(self.album.tracks)
    //  self.playSong(self.queue[0])
    //}

    //clear queue and play album, from specific song
    self.playAlbumSong = song => {
      self.queue(self.album().tracks())

      self.queue().forEach((s, i) => {
        //s.playing = ko.observable(false)
        if(s._id() == song._id()) {
          self.queuePos(i)
          s.playing(true)
        }
      })
      self.play()
    }

    //play the song at queuePos
    self.play = () => {
      const song = self.queue()[self.queuePos()]

      const id = song._id()
      const ext = song.location().substr(song.location().lastIndexOf('.'))
      const url = `/api/stream/${id}${ext}`
      self.audio.src = url

      self.playing.title(song.title())
      self.playing.artist(song.albumartist())
      self.playing.duration(song.duration())
      self.playing.art(song.art())

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: self.playing.title(),
          artist: self.playing.artist(),
          album: self.playing.album(),
          artwork: [
            { src: 'https://dummyimage.com/96x96', sizes: '96x96', type: 'image/png' }
          ]
        })
      }

      document.title = song.title() + ' - ' + song.albumartist() + ' | FALK'
    }
    self.playPrev = () => {
      if(self.queuePos() > 0) {
        self.queuePos(self.queuePos() - 1)
      }
    }
    self.playNext = () => {
      if(self.queuePos() < self.queue().length - 1) {
        self.queuePos(self.queuePos() + 1)
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
        if(self.queuePos() < self.queue().length - 1) {
          self.queuePos(self.queuePos() + 1)
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
    self.showMenu = function() {
      self.menuState(true)
    }

    self.settings = {
      directories: {
        location: ko.observable('/home/bob'),
        list: ko.observable([ { name: '..' }, { name: 'test' }, { name: 'joe' } ]),
        load: function(e) {
          let next
          const curLocation = self.settings.directories.location()
          if (e.name === '..') {
            next = curLocation.substr(0, curLocation.lastIndexOf('/'))
            if (next === '') {
              next = '/'
            }
          } else {
            if (curLocation === '/') {
              next = '/' + e.name
            } else {
              next = curLocation + '/' + e.name
            }
          }
          console.log(next)
          body = JSON.stringify({ location: next })
          window.fetch('/api/directories', { method: 'post', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: body })
            .then(response => response.json())
            .then(data => {
              self.settings.directories.location(data.location)
              self.settings.directories.list(data.directories)
            })
        }
      }
    }

    // this is called when a new link is added to the page (these are manual!)
    self.updateLinks = function() {
      self.router.updatePageLinks()
    }

    self.router = new Navigo('/')
    self.router
      .hooks({
        after(match) {
          self.menuState(false)
        }
      })
      .on('/', () => {
        self.tiles([])
        self.pageTitle('Home')
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
      })
      .on('/artists', () => {
        window.fetch('/api/artists')
          .then(response => response.json())
          .then(data => {
            if (data.length > 0) {
              data.map(e => {
                e.title = e.artist,
                e.url = `/artist/${encodeURIComponent(e.artist)}`,
                e.subtitle = '',
                e.surl = ''
              })
              self.tiles(data)
              self.pageTitle('Artists')
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
              data.map(e => {
                e.title = e.album,
                e.url = `/album/${encodeURIComponent(e.albumartist)}/${encodeURIComponent(e.album)}`,
                e.subtitle = e.year,
                e.surl = ''
              })
              self.tiles(data)
              self.pageTitle(artist)
            } else {
              // nothing in the library!
            }
          })
      })
      .on('/album/:artist/:album', (params) => {
        const artist = params.data.artist
        const album = params.data.album
        window.fetch(`/api/album/${ encodeURIComponent(artist) }/${ encodeURIComponent(album) }`)
          .then(response => response.json())
          .then(data => {
            data.tracks.map(e => {
              // e.title = e.track + '. ' + e.title
              e.shortformat = (e.format.samplerate / 1000) + 'kHz ' + ((e.format.bits) ? e.format.bits + 'bit' : '')
              e.playing = false
            })
            if (data.tracks.length > 0) {
              data.year = data.tracks[0].year
              data.genre = data.tracks[0].genre
              data.shortformat = ((data.tracks.every((i) => i.shortformat === data.tracks[0].shortformat)) ? data.tracks[0].shortformat : 'Mixed')
            }
            self.album(ko.mapping.fromJS(data))
            self.pageTitle(album + ' - ' + artist)
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
              data.map(e => {
                e.title = e.album,
                e.url = `/album/${encodeURIComponent(e.albumartist)}/${encodeURIComponent(e.album)}`,
                e.subtitle = e.albumartist,
                e.surl = `/artist/${encodeURIComponent(e.albumartist)}`
              })
              self.tiles(data)
              self.pageTitle('Albums')
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
            } else {
              // nothing in the library!
            }
          })
      })
      .on('/settings', () => {
        self.pageTitle('Settings')
        self.tiles([])
        window.fetch('/api/directories', { method: 'post' })
          .then(response => response.json())
          .then(data => {
            self.settings.directories.location(data.location)
            self.settings.directories.list(data.directories)
          })
      })
      .resolve()
}

ko.applyBindings(new AppViewModel())

//hide any visible dropdown if someone clicks on the body
document.body.addEventListener('click', (e) => {
  if (e.target.closest('div') === null || !e.target.closest('div').classList.contains('dropdown')) {
    document.querySelectorAll('div.dropdown').forEach(function (f) {
      f.classList.remove('is-active')
    })
  }
})