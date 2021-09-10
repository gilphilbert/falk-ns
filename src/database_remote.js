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

    getPlaylists () {
      return new Promise((resolve, reject) => {
        fetch(`/api/playlist`)
          .then(data => data.json())
          .then(data => resolve(data))
      })
    }

    getPlaylist (id) {
      return new Promise((resolve, reject) => {
        fetch(`/api/playlist/${id}`)
          .then(data => data.json())
          .then(data => resolve(data))
      })
    }

    newPlaylist (name, track) {
      return new Promise((resolve, reject) => {
        const body = JSON.stringify({ name: name, tracks: [ track ]})
        fetch(`/api/playlist`, {
          method: 'post',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: body
        })
          .then(() => resolve())
          .catch((e) => reject(e))
      })
    }

    addToPlaylist (id, track) {
      return new Promise((resolve, reject) => {
        const body = JSON.stringify({ tracks: [ track ]})
        fetch(`/api/playlist/` + id, {
          method: 'put',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: body
        })
          .then(() => resolve())
          .catch((e) => reject(e))
      })    }
  }