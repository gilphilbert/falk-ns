export class DatabaseHandler {
  constructor () { }

  async getStats () {
      return fetch('/api/stats')
      .then(data => data.json())
  }

  async getArtists () {
    return fetch('/api/artists')
      .then(data => data.json())
  }

  async getArtist (artist) {
    return fetch(`/api/artist/${encodeURIComponent(artist)}`)
      .then(data => data.json())
  }

  async getAlbums () {
    return fetch(`/api/albums`)
      .then(data => data.json())
  }

  async getAlbum (artist, album) {
    return fetch(`/api/album/${encodeURIComponent(artist)}/${encodeURIComponent(album)}`)
      .then(data => data.json())
  }

  async getGenres () {
    return fetch(`/api/genres`)
      .then(data => data.json())
  }

  async getGenre (genre) {
    return fetch(`/api/genre/${encodeURIComponent(genre)}`)
      .then(data => data.json())
  }

  async getPlaylists () {
    return fetch(`/api/playlist`)
      .then(data => data.json())
  }

  async getPlaylist (id) {
    return fetch(`/api/playlist/${id}`)
      .then(data => data.json())
  }

  async newPlaylist (name, track) {
    return fetch(`/api/playlist`, {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: name, tracks: [ track ]})
    })
      .then(data => data.json())
  }

  async addToPlaylist (id, track) {
    return fetch(`/api/playlist/${id}`, {
        method: 'put',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tracks: [ track ]})
      })
  }

  async removeFromPlaylist (plID, index) {
    return fetch(`/api/playlist/${plID}/${index}`, { method: 'delete' })
      .then(data => data.json())
  }

  async quickSearch(query) {
    return fetch('/api/search/' + query)
      .then(data => data.json())
  }
}