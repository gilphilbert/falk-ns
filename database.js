const Datastore = require('nedb')
let musicDB = new Datastore({ filename: 'data/music.db', autoload: true })
musicDB.ensureIndex({ fieldName: 'location', unique: true }, function (err) {
    // If there was an error, err is not null
    if(err) {
        console.log('skipping duplicate entry')
    }
  })
  
//let musicDB = new Datastore()

const get = {
    allSongs: () => {
        const promise = new Promise(function (resolve, reject) {
            musicDB.find({}, (err, data) => {
                if (err || data.length === 0) {
                    reject(err)
                }
                resolve(data)
            })
        })
        return promise
    },
    url: (id) => {
        const promise = new Promise(function (resolve, reject) {
            musicDB.find({ _id: id }, { location: 1 }, (err, data) => {
                if (err || data.length === 0) {
                    reject(err)
                }
                resolve(data[0])
            })
        })
        return promise
    },
    artists: () => {
        return new Promise(function (resolve, reject) {
            musicDB.find({ }, { albumartist: 1 }, (err, data) => {
                let artists = []
                if (!err && data.length > 0) {
                    artists = [...new Set(data.map(song => song.albumartist))]
                    resolve(artists)
                }
                reject()
            })
        })
    },
    artistAlbums: (artist) => {
        const promise = new Promise(function (resolve, reject) {

            musicDB.find({ albumartist: artist }, { albumartist: 1, album: 1, year: 1, _id: 0 }, (err, data) => {
                let albums = []
                if (!err &&  data.length > 0) {
                    albums = data.filter((tag, index, array) => array.findIndex(t => t.album == tag.album) == index)
                    resolve(albums)
                }
                reject()
            })
        })
        return promise
    },
    album: (artist, album) => {
        const promise = new Promise(function (resolve, reject) {

            musicDB.find({ albumartist: artist, album: album }, (err, data) => {
                let albums = []
                if (!err &&  data.length > 0) {
                    data = data.sort((a, b) => { return a.track - b.track } )
                    resolve(data)
                }
                reject()
            })
        })
        return promise
    },
    albums: () => {
        const promise = new Promise(function (resolve, reject) {

            musicDB.find({ }, { albumartist: 1, album: 1, _id: 0 }, (err, data) => {
                let albums = []
                if (!err &&  data.length > 0) {
                    albums = data.filter((tag, index, array) => array.findIndex(t => t.album == tag.album && t.albumartist == tag.albumartist) == index)
                    resolve(albums)
                }
                reject()
            })
        })
        return promise
    },
    genres: () => {
        return new Promise(function (resolve, reject) {
            musicDB.find({ }, { genre: 1 }, (err, data) => {
                let genres = []
                if (!err && data.length > 0) {
                    genres = [...new Set(data.map(song => song.genre[0]))]
                    resolve(genres)
                }
                reject()
            })
        })
    }
}

const add = {
    song: (meta) => {
        musicDB.insert(meta, (err, doc) => {
            if (err) {
                console.log(err)
                return
            }
        })
    }
}

const search = {

}

module.exports = {
    getMusic: get,
    searchMusic: search,
    addMusic: add
}