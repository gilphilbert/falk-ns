export class DatabaseHandler {
    constructor () { }
  
    async getStats () {
      return new Promise((resolve, reject) => {
        fetch('/api/stats')
          .then(data => data.json())
          .then(data => resolve(data))
      })
    }
  
    getArtists () {
      return new Promise((resolve, reject) => {
        fetch('/api/artists')
          .then(data => data.json())
          .then(data => resolve(data))
      })
    }
  
    getArtist (artist) {
      return new Promise((resolve, reject) => {
        fetch(`/api/artist/${artist}`)
          .then(data => data.json())
          .then(data => resolve(data))
      })
    }
  
    getAlbums () {
      return new Promise((resolve, reject) => {
        fetch(`/api/albums`)
          .then(data => data.json())
          .then(data => resolve(data))
      })
    }
  
    getAlbum (artist, album) {
      return new Promise((resolve, reject) => {
        fetch(`/api/album/${artist}/${album}`)
          .then(data => data.json())
          .then(data => resolve(data))
      })
    }
  
    getGenres () {
      return new Promise((resolve, reject) => {
        fetch(`/api/genres`)
          .then(data => data.json())
          .then(data => resolve(data))
      })
    }
  
    getGenre (genre) {
      return new Promise((resolve, reject) => {
        fetch(`/api/genre/${genre}`)
          .then(data => data.json())
          .then(data => resolve(data))
      })
    }
  }