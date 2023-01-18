let knex = null

async function buildTables () {

  await knex.schema.createTable('tracks', function (table) {
    table.increments('id')
    table.string('path').unique()
    table.string('type')
    table.integer('disc')
    table.integer('track')
    table.string('title')
    table.string('album')
    table.string('artist')
    table.string('albumartist')
    table.string('genre')
    table.integer('year')
    table.integer('duration')
    table.boolean('lossless')
    table.float('samplerate')
    table.integer('bits')
    table.integer('channels')
    table.string('codec')
    table.string('artistart')
    table.string('coverart')
    table.string('discart')
    table.string('backgroundart')
    table.integer('playcount')
    table.integer('lastplayed')
    table.integer('added')
    table.boolean('favorite')
    table.index(['album', 'artist'])
  })
  /*
  await knex.schema.createTable('artists', function (table) {
    table.increments('id')
    table.string('name')
    table.string('background')
    table.string('thumb')
    table.string('backgrounds')
    table.string('thumbs')
  })
  */
  await knex.schema.createTable('paths', function (table) {
    table.string('path').primary()
  })

  await knex.schema.createTable('playlists', function (table) {
    table.increments('id')
    table.string('name').unique()
    table.string('coverart')
    table.integer('added')
  })

  await knex.schema.createTable('playlist_tracks', function (table) {
    table.integer('playlist')
    table.integer('track')
    table.primary(['playlist', 'track'])
    table.foreign('playlist').references('playlists.id').onDelete('cascade')
    table.foreign('track').references('tracks.id').onDelete('cascade')
  })
}

async function init () {
  knex = require('knex')({
    client: 'sqlite3',
    connection: {
      filename: "./data/falk.sql"
    }
  })

  await knex.raw('PRAGMA foreign_keys = ON;').then(() => {
    console.log('SQLite foreign keys enabled')
  })

  if (! await knex.schema.hasTable('tracks')) {
    await buildTables()
  }
}

const tracks = {
  add: async (info) => {
    const tr = {
      path: info.path,
      type: info.type || '',
      disc: info.disc || 0,
      track: info.track || 0,
      title: info.title || 'unknown track',
      album: info.album || 'unknown album',
      artist: info.artists[0] || 'unknown artist',
      albumartist: info.albumartist || 'unkown artist',
      genre: info.genre || 'unknown',
      year: info.year || 0,
      duration: info.duration || 0,
      lossless: info.format.lossless,
      samplerate: info.format.samplerate || 0,
      bits: info.format.bits || 0,
      channels: info.format.channels || 0,
      codec: info.format.codec || '',
      artistart: info.art.artist || '',
      coverart: info.art.cover || '',
      discart: info.art.disc || '',
      backgroundart: info.art.background || '',
      playcount: 0,
      lastplayed: 0,
      added: Date.now(),
      favorite: false
    }
    return knex('tracks').insert(tr)
  },
  update: async (info) => {
    const tr = {
      path: info.path,
      type: info.type || '',
      disc: info.disc || 0,
      track: info.track || 0,
      title: info.title || 'unknown track',
      album: info.album || 'unknown album',
      artist: info.artists[0] || 'unknown artist',
      albumartist: info.albumartist || 'unkown artist',
      genre: info.genre || 'unknown',
      year: info.year || 0,
      duration: info.duration || 0,
      lossless: info.format.lossless,
      samplerate: info.format.samplerate || 0,
      bits: info.format.bits || 0,
      channels: info.format.channels || 0,
      codec: info.format.codec || '',
      artistart: info.art.artist || '',
      coverart: info.art.cover || '',
      discart: info.art.disc || '',
      backgroundart: info.art.background || '',
      playcount: 0,
      lastplayed: 0,
      added: Date.now(),
      favorite: false
    }
    return knex('tracks').where('path', tr.path).update(tr)
  },
  removeByPath: (path) => {
    return knex('tracks').where('path', path).delete()
  },
  trackByPath: (path) => {
    return knex.from('tracks').select('*').where('path', path)
      .then(rows => ((rows.length > 0) ? rows[0] : false))
  },
  trackExists: (path) => {
    return knex.from('tracks').select('id').where('path', path)
      .then(rows => rows.length > 0)
  },
  getPath: (id) => {
    return knex.from('tracks').select('path').where('id', id)
      .then(rows => ((rows.length > 0) ? rows[0].path : ''))
  },
  getAllPaths: () => {
    return knex.from('tracks').select('path')
      .then(rows => rows.map(r => r.path))
  },
  incrementPlay: (path) => {
    return knex.from('tracks').where('path', path).increment('playcount', 1)
  }
}

const library = {
  stats: function () {
    return Promise.all([
      knex('tracks').countDistinct('artist'),
      knex('tracks').countDistinct('album'),
      knex('tracks').count()
    ])
    .then(([artists, albums, tracks]) => { 
      return {
        songs: tracks[0]['count(*)'],
        artists: artists[0]['count(distinct `artist`)'],
        albums: albums[0]['count(distinct `album`)']
      }
     })
  },
  artists: function () {
    return knex.raw('select `albumartist` as `name`, `artistart` as `art` from `tracks` group by LOWER(TRIM(`albumartist`)) order by `name`')
  },
  artist: function (artistName) {
    return knex.from('tracks').select('album as name', 'year', 'artistart', 'backgroundart', 'coverart').where('albumartist', '=', artistName).groupBy('album').orderBy([{ column: 'year' }, { column: 'album' }])
      .then((rows) => {
        let background = '',  
            artistart = '',
            albums = []
        for (row of rows) {
          if (background === '' && row['backgroundart'] !== null) background = row['backgroundart']
          if (artistart === '' && row['artistart'] !== null) artistart = row['artistart']
          albums.push({
            name: row['name'],
            year: row['year'],
            art: row['coverart']
          })
        }
        return {
          artist: artistName,
          background,
          artistart,
          albums
        }
      })
      .catch(err => console.log(err))
  },
  albums: function () {
    return knex.from('tracks').select('album as name', 'albumartist as artist', 'coverart as art').groupBy('album', 'albumartist').orderBy('name')
  },
  album: function (artist, album) {
    return knex.from('tracks').select('*').where('albumartist', artist).andWhere('album', album).orderBy('track', 'disc')
      .then((rows) => {
        rows.map(r => {
          r.shortformat = (r.samplerate / 1000) + 'kHz ' + ((r.bits) ? r.bits + 'bit' : '')
          r.shortestformat = (r.samplerate / 1000) + '/' + ((r.bits) ? r.bits : '')
          return r
        })
        return {
          title: rows[0].album,
          art: rows[0].coverart,
          artist: rows[0].albumartist,
          year: rows[0].year,
          genre: rows[0].genre,
          shortformat: rows[0].shortformat,
          shortestformat: rows[0].shortestformat,
          tracks: rows
        }
      })
  },
  genres: function () {
    return knex.raw('select `genre` as `name`, `coverart` as `art` from `tracks` group by LOWER(TRIM(`genre`)) order by `name`')
    //return knex.from('tracks').select('genre as name', 'coverart as art').groupBy('name').orderBy('name')
  },
  genre: function (genre) {
    return knex.from('tracks').select('album as name', 'albumartist as artist', 'coverart as art').where('genre', '=', genre).groupBy('album').orderBy('name')
  },
  popular: function () {
    return knex.from('tracks').select('*').orderBy('playcount', 'desc').limit(100)
      .then((tracks) => {
        return {
          id: '_mostplayed',
          name: 'Most Played',
          coverart: ((tracks.length > 0) ? tracks[0].coverart : ''),
          tracks: tracks.map(r => {
            r.shortformat = (r.samplerate / 1000) + 'kHz ' + ((r.bits) ? r.bits + 'bit' : '')
            r.shortestformat = (r.samplerate / 1000) + '/' + ((r.bits) ? r.bits : '')
            return r
          })
        }
      })
  },
  search: function (query) {
    return Promise.all([
      knex('tracks').select('albumartist as name', 'artistart as art').groupByRaw('LOWER(TRIM(albumartist))').orderBy('name').whereRaw("LOWER(name) LIKE '%' || LOWER(?) || '%' ", query).limit(20),
      knex('tracks').select('album as title', 'albumartist as artist', 'coverart as art').groupBy('album', 'albumartist').orderBy('album').whereRaw("LOWER(album) LIKE '%' || LOWER(?) || '%' ", query).limit(20),
      knex('tracks').select('id', 'title', 'album', 'artist', 'albumartist', 'duration', 'coverart as art', 'playcount').whereRaw("LOWER(title) LIKE '%' || LOWER(?) || '%' ", query).limit(20),
    ])
    .then(([artists, albums, tracks]) => { 
      return {
        artists,
        albums,
        tracks
      }
     })
  }
}

const playlists = {
  add: function (name, tracks) {
    return knex('playlists').insert({ name: name, added: Date.now(), coverart: '' })
      .then((rows) => {
        return rows[0]
      })
      .then(plID => {
        const trs = tracks.map(t => { return { playlist: plID, track: t } })
        return knex('playlist_tracks').insert(trs)
      })
  },
  list: function () {
    return knex('playlists').select('id', 'name', 'coverart').orderBy('name')
  },
  get: function (id) {
    return Promise.all([
      knex('playlists').select('id', 'name', 'coverart', 'added').where('id', id),
      knex('playlist_tracks').leftJoin('tracks', 'playlist_tracks.track', 'tracks.id').select('tracks.*').where('playlist_tracks.playlist', id)
    ])
    .then(([playlist, tracks]) => {
      const pl = playlist[0]
      return {
        id,
        name: pl.name,
        coverart: pl.coverart,
        added: pl.added,
        tracks: tracks.map(r => {
          r.shortformat = (r.samplerate / 1000) + 'kHz ' + ((r.bits) ? r.bits + 'bit' : '')
          r.shortestformat = (r.samplerate / 1000) + '/' + ((r.bits) ? r.bits : '')
          return r
        })
      }
    })
  },
  addTracks: function (id, tracks) {
    return knex('playlist_tracks').insert(tracks.map(t => { return { playlist: id, track: t } }))
  },
  removeTracks: function (playlist, track) {
    return knex('playlist_tracks').select().where('playlist', playlist).andWhere('track', track).delete()
      .then(() => playlists.get(playlist))
  }
}

const locations = {
  add: function (path) {
    return knex('paths').insert({ path })
      .then(() => locations.paths())
  },
  remove: function (path) {
    return Promise.all([
      // find and remove the location
      knex('paths').where('path', '=', path).delete(),
      // remove any associated tracks
      knex('tracks').where('path', 'like', path + '%').delete()
    ])
    .then(() => locations.paths())
  },
  paths: function () {
    return knex.from('paths').select('*').orderBy('path')
      .then(rows => rows.map(r => r.path))
  }
}

module.exports = {
  init,
  tracks,
  locations,
  library,
  playlists
}
