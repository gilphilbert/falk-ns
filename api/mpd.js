const mpdapi = require('mpd-api')
const database = require('./database')

const config = {
  //path: '/run/mpd/socket',
  path: '/home/phill/.config/mpd/socket',
}

let client = false

function init (sendEvent) {
  return mpdapi.connect(config)
  .then(con => {
    client = con
    client.on('system', (e) => {
      console.log(e)
      switch (e) {
        case 'playlist':
          sendQueue()
          /*
          mpdc.api.queue.info()
            .then((d) => {
              d.forEach((i) => {
                //i.albumart = '/art/album/' + encodeURIComponent(i.artist) + '/' + encodeURIComponent(i.album) + '.jpg'
                //i.thumb = '/art/album/thumb/' + encodeURIComponent(i.artist) + '/' + encodeURIComponent(i.album) + '.jpg'
                //i = getSongArt(i)
              })
              
              //broadcast('pushQueue', d)
            })
            */
          break
        case 'player':
          //incrementTrack()
          _sendState()
        case 'options':
          //getStatus().then(status => broadcast('pushStatus', status))
          break
        default:
          console.log('[MPD] Unknown State Change:' + e)
      }
    })
    return true
  })
  .catch(e => {
    return false
  })
}

function getState() {
  return client.api.status.get()
    .then(data => {
      return {
        paused: data.state !== 'play',
        position: data.song || 0,
        elapsed: ((data.elapsed !== undefined) ? Math.round(data.elapsed) : 0),
      }
    })
    .catch(e => {
      return {
        paused: false,
        position: -1,
        elapsed: 0,
      }
    })
}

async function sendQueue (save = false) {
  let items = []
  let paths = []
  const q = await client.api.queue.info()
  const st = await client.api.status.get()
  const cur = st.song
  for (const tr of q) {
    console.log(tr.file)
    const track = await database.tracks.trackByPath(tr.file)
    console.log(track)
    items.push({
      title: track.title,
      artist: track.albumartist,
      duration: track.duration,
      album: track.album,
      art: track.coverart,
      discart: track.discart,
      playing: ((tr.pos === cur) ? true : false),
      shortformat: (track.samplerate / 1000) + 'kHz ' + ((track.bits) ? track.bits + 'bit' : ''),
    })
  }
  sendEvent({ queue: items, state: await getState() }, { event: 'queue' })
}

async function _sendState(send) {
  data = await getState()
  sendEvent(data, { event: 'status' })
}

player = {
  //playback related items
  play: async function () {
    return mpd.api.playback.play()
  },
  stop: async function () {
    return mpd.api.playback.stop()
  },
  pause: async function () {
    return mpd.api.playback.pause()
  },
  toggle: async function () {
    const st = await client.api.status.get()
    if (st.state === 'play') {
      return client.api.playback.pause()
    } else {
      return client.api.playback.play()
    }
  },
  prev: async function () {
    /*
    try {
      await mpv.prev()
    } catch (e) { console.log("[INFO] [Player] Error skipping back") }
    */
  },
  next: async function () {
    /*
    try {
      await mpv.next()
    } catch (e) { console.log("[INFO] [Player] Error skipping forward") }
    */
  },
  jump: async function (pos) {
    /*
    try {
      await mpv.jump(pos)
      const pau = await mpv.isPaused()
      if (pau)
        await mpv.play()
    } catch (e) { console.log("[INFO] [Player] Error jumping") }
    */
  },
  clear: async function () {
    /*
    try {
      await mpv.clearPlaylist()
      sendEvent(await getQueue(), { event: 'playlist' })
    } catch (e) { console.log("[INFO] [Player] Error clearing playlist") }
    */
  },
  shuffle: async function () {
    /*
    try {
      await mpv.shuffle()
      //sendEvent(await getQueue(), { event: 'playlist' })
      sendQueue()
    } catch (e) { console.log("[INFO] [Player] Error shuffling") }
    */
  },
  remove: async function (pos) {
    /*
    try {
      await mpv.playlistRemove(pos)
      //sendEvent(await getQueue(), { event: 'playlist' })
      sendQueue()
    } catch (e) {}
    */
  },
  enqueue: async function (tracks) {
    /*
    for (i = 0; i < tracks.length; i++) {
      await mpv.append(await database.tracks.getPath(tracks[i]))
    }
    //sendEvent(await getQueue(), { event: 'playlist' })
    sendQueue()
    */
  },
  playNext: async function (tracks) {
    /*
    let plPos = -1
    try {
      plPos = await mpv.getPlaylistPosition()
    } catch (e) { console.log("[INFO] [Player] Can't get playlist position") }

    let plSize = -1
    try {
      plSize = await mpv.getPlaylistSize()
    } catch (e) { console.log("[INFO] [Player] Can't get playlist size") }
    console.log('size :: ' + plSize)
    for (i = 0; i < tracks.length; i++) {
      await mpv.append(await database.tracks.getPath(tracks[i]))
      await mpv.playlistMove(plSize + i, plPos + i + 1)
    }
    //sendEvent(await getQueue(), { event: 'playlist' })
    sendQueue()
    */
  },
  replaceAndPlay: async function (tracks, index) {
    try {
      await client.api.playback.stop()
    } catch (e) { console.log("[INFO] [Player] Can't stop player") }

    try {
      await client.api.queue.clear()
    } catch (e) { console.log("[INFO] [Player] Can't clear queue") }

    for (i = 0; i < tracks.length; i++) {
      const path = await database.tracks.getPath(tracks[i])
      console.log(path)
      //const path = "/var/lib/mpd/music/12.flac"
      try {
        await client.api.queue.add(path)
      } catch (e) { console.log(`[ERROR] [Player] Can't add track (${ tracks[i] })`); console.log(e) }
    }
    //sendEvent(await getQueue(), { event: 'playlist' })
    try {
      await client.api.playback.play(index)
    } catch (e) { console.log("[INFO] [Player] Can't play at index (invalid)") }
    sendQueue()
  },
  sendState: async function () {
    _sendState()
    sendQueue()
  },

  // settings related items
  devices: async function () {
    /*
    const devices = await mpv.getProperty(`audio-device-list`)
    console.log(devices)
    return devices
    */
  }
}

module.exports = {
  init,
  player
}