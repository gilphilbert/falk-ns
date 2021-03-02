const vmTiles = function (params) {
  this.tiles = params.tiles
}
ko.components.register('tiles', {
  viewModel: vmTiles,
  template: { element: 't-tiles' }
})

const vmTile = function (params) {
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

const vmAlbum = function (params) {
  this.album = params.album()
  this.tracks = this.album.tracks()
  console.log(this.tracks)
  //this.year = '2006'
  //this.title = "test"
}
ko.components.register('album', {
  viewModel: vmAlbum,
  template: { element: 't-album' }
})

function MyViewModel() {
    var self = this

    self.tiles = ko.observable([])
    self.album = ko.observable(null)

    self.playlist = ko.observable([])

    self.togglePlay = () => {
      const audio = document.getElementById('audio-player')
      if (audio.paused) {
        audio.play()
      } else {
        audio.pause()
      }
    }

    self.playSong = song => {
      const id = song._id()
      const ext = song.location().substr(song.location().lastIndexOf('.'))
      const url = `/api/stream/${id}${ext}`
      const audio = document.getElementById('audio-player')
      audio.src = url
      audio.play()
    }

    self.clearPlaySong = song => {
      song = song || null
      self.playlist([song])
      self.playSong(song)
    }

    self.clearPlayAlbum = () => {
      self.playlist(self.album.tracks)
      self.playSong(self.playlist[0])
    }

    const router = new Navigo('/')
    router
      .on('/', () => {
        self.tiles([])
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
        self.tiles([])
      })
      .on('/artists', () => {
        window.fetch('/api/artists')
          .then(response => response.json())
          .then(data => {
            data.map(e => {
              e.title = e.artist,
              e.url = `/artist/${encodeURIComponent(e.artist)}`,
              e.subtitle = '',
              e.surl = ''
            })
            self.tiles(data)
          })
      })
      .on('/artist/:artist', (params) => {
        const artist = params.data.artist
        window.fetch('/api/artist/' + encodeURIComponent(artist))
          .then(response => response.json())
          .then(data => {
            data.map(e => {
              e.title = e.album,
              e.url = `/album/${encodeURIComponent(e.albumartist)}/${encodeURIComponent(e.album)}`,
              e.subtitle = e.year,
              e.surl = ''
            })
            self.tiles(data)
          })
      })
      .on('/album/:artist/:album', (params) => {
        const artist = params.data.artist
        const album = params.data.album
        window.fetch(`/api/album/${ encodeURIComponent(artist) }/${ encodeURIComponent(album) }`)
          .then(response => response.json())
          .then(data => {
            data.tracks.map(e => {
              e.title = e.track + '. ' + e.title
              e.shortformat = (e.format.samplerate / 1000) + 'kHz ' + e.format.bits + 'bit'
            })
            if (data.tracks.length > 0) {
              data.year = data.tracks[0].year
              data.genre = data.tracks[0].genre
              data.shortformat = ((data.tracks.every((i) => i.shortformat === data.tracks[0].shortformat)) ? data.tracks[0].shortformat : 'Mixed')
            }
            self.album(ko.mapping.fromJS(data))
            /*
            data.map(e => {
              e.title = e.album,
              e.url = `/album/${encodeURIComponent(e.albumartist)}/${encodeURIComponent(e.album)}`,
              e.subtitle = e.year,
              e.surl = ''
            })
            console.log(data)
            self.tiles(data)
            */
          })
      }, {
        leave: (done) => {
          self.album(null)
          //console.log('leaving')
          done()
        }
      })
      .on('/albums', () => {
        window.fetch('/api/albums')
          .then(response => response.json())
          .then(data => {
            data.map(e => {
              e.title = e.album,
              e.url = `/album/${encodeURIComponent(e.albumartist)}/${encodeURIComponent(e.album)}`,
              e.subtitle = e.albumartist,
              e.surl = `/artist/${encodeURIComponent(e.albumartist)}`
            })
            self.tiles(data)
          })
      })
      .on('/genres', () => {
        window.fetch('/api/genres')
          .then(response => response.json())
          .then(data => {
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
          })
      })
      .on('/settings', () => {
        self.tiles([])
      })
      .resolve()
}

ko.applyBindings(new MyViewModel())

//hide any visible dropdown if someone clicks on the body
document.body.addEventListener('click', (e) => {
  if (!e.target.closest('div').classList.contains('dropdown')) {
    document.querySelectorAll('div.dropdown').forEach(function (f) {
      f.classList.remove('is-active')
    })
  }
})

function playSong(url) {
  const audio = document.getElementById('audio-player')
  audio.src = url
  audio.play()
}
function pause() {
  const audio = document.getElementById('audio-player')
  if (audio.paused) {
    audio.play()
  } else {
    audio.pause()
  }
}