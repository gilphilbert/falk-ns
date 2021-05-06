export class DatabaseHandler {
    constructor (callback) {
      this.db = new loki ('falkns0113.db', {
        autoload: true,
        autoloadCallback: () => {
          // load the collection (or create if it's empty)
          this.music = this.db.getCollection('songs')
          if (!this.music) {
            this.music = this.db.addCollection('songs', { unique: ['id'] })
          }
          //  if there's at least some music, call the callback
          //if (this.music.count() > 0 && typeof callback === 'function') {
          //  callback()
          //  this.update()
          //} else {
          //  // otherwise we might as well load the database before we begin
          //  this.update(callback)
          //}
          callback()
        },
        autosave: true,
        autosaveInterval: 4000
      })
    }
  
    async update (callback) {
      callback = callback || null
      // load the data from the API (needs some error handling)
      try {
        // reset all songs to be missing
        this.music.chain().find().update((song) => {
          song.present = false
        })
  
        let response = await window.fetch('/api/songs/all')
        let res = await response.json()
        const limit = res.data.length
        let offset = limit
        // pull the remaining songs from the API, using the limit provided by the API
        do {
          res.data.forEach(s => {
            this.addSong(s)
          })
  
          response = await window.fetch('/api/songs/all/' + offset + '/' + limit)
          res = await response.json()
          offset = offset + res.data.length
        } while (res.data.length > 0)
  
        // remove anything we haven't seen
        this.music.chain().find({ present: false }).remove()
      } catch (e) {
        console.log('Could not connect to API to update library', e)
      }
      if (callback !== null) {
        callback()
      }
    }
  
    addSong (song) {
      try {
        // get the song from the database using the index (very fast!)
        const dbSong = this.music.findOne({ _id: song.$loki }) || null
        // if the song isn't in the database
        if (dbSong === null) {
          // simply insert it, then correct the ID and metadata as sent by the server
          const s = this.music.insert({ _id: song.$loki, info: song.info, favorite: song.favorite, playCount: song.playCount, cached: false, present: true })
          s.meta = song.meta
          this.music.update(s)
        } else {
          // the song already exists, let's check if the metadata has changed
          if (JSON.stringify(dbSong.info) !== JSON.stringify(song.info)) {
            // info has changed, update
            dbSong.info = song.info
            // mark the song as in the database
            // now we need to check to see if the other data has changed... <----------------------------------------------------------
          }
          dbSong.present = true
          this.music.update(dbSong)
        }
      } catch (e) {
        console.error('Could not add song to database', e)
      }
    }
  
    getStats () {
      const ret = { songs: 0, albums: 0, artists: 0 }
      const allSongs = this.music.find()
      ret.songs = allSongs.length
      ret.artists = [...new Set(allSongs.map(song => song.info.albumartist))].length
      ret.albums = [...new Set(allSongs.map(song => song.info.album))].length
      return ret
    }
  
    async getArtists () {
      const artists = this.music.chain().find().compoundsort([['info.artist.art', true], 'info.albumartist']).data()
      return artists
        .filter((tag, index, array) => array.findIndex(t => t.info.albumartist === tag.info.albumartist) === index)
        .map(a => { return { title: a.info.albumartist, art: '/art/' + ((a.info.art.artist !== '') ? a.info.art.artist : 'placeholder.png'), url: `/artist/${encodeURIComponent(a.info.albumartist)}`, subtitle: '', surl: '' } })
    }
  
    async getArtist (artist) {
      // const s_artist = this.artists.by('name', artist) || null
      const artistArt = this.music.chain().find({ 'info.albumartist': artist }).compoundsort([['info.artist.art', true], 'info.albumartist']).limit(1).data()[0].info.art.artist
      const songs = this.music.chain().find({ 'info.albumartist': artist }).simplesort('info.year').data()
      const albums = songs.map(e => {
        return {
          art: '/art/' + ((e.info.art.cover !== '') ? e.info.art.cover : 'placeholder.png'),
          artistart: '/art/' + ((artistArt !== '') ? artistArt : 'placeholder.png'),
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
          art: '/art/' + ((e.info.art.cover !== '') ? e.info.art.cover : 'placeholder.png'),
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
        s.info._id = s._id
        s.info.shortformat = (s.info.format.samplerate / 1000) + 'kHz ' + ((s.info.format.bits) ? s.info.format.bits + 'bit' : '')
        s.info.artist = ((s.info.artists.length > 0) ? s.info.artists[0] : s.info.albumartist)
        s.info.art.cover = ((s.info.art.cover !== '') ? s.info.art.cover : 'placeholder.png')
        return s.info
      })
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
          art: '/art/' + ((e.info.art.cover) ? e.info.art.cover : 'placeholder.png'),
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
          art: '/art/' + ((e.info.art.cover) ? e.info.art.cover : 'placeholder.png'),
          title: e.info.album,
          url: `/album/${encodeURIComponent(e.info.albumartist)}/${encodeURIComponent(e.info.album)}`,
          subtitle: e.info.albumartist,
          surl: `/artist/${encodeURIComponent(e.info.albumartist)}`
        }
      }).filter((tag, index, array) => array.findIndex(t => t.title === tag.title && t.subtitle === tag.subtitle) === index)
      return albums
    }
  }