const mpdapi = require('mpd-api')
const database = require('./database')

const fs = require('fs')

const socketLocations = [ '/home/phill/.mpd/socket', '/run/mpd/socket' ]

const config = {
  path: (() => {
    return socketLocations.filter(value => fs.existsSync(value))[0]
  })()
}

console.log(config)

let client = false

function init () {
  var socket = socketLocations.filter(value => fs.existsSync(value))[0]
  var config = {}
  if (socket) {
    config['path'] = socket
  } else {
    config['host'] = '127.0.0.1'
    config['port'] = '6600'
  }
  //console.log(config)
  return mpdapi.connect(config)
  .then(con => {
    client = con
    client.on('system', async (e) => {
      switch (e) {
        case 'playlist':
          sendQueue()
          break
        case 'player':
          _sendState()
          const st = await client.api.status.get()
          if (st.elapsed && st.elapsed <= 1) {
            const q = await client.api.queue.info()
            console.log('incrementing play')
            await database.tracks.incrementPlay(q[st.song].file)
          }
          break
        default:
          console.log('[INFO] [MPD] Unregistered State Change:' + e)
      }
    })
    console.info("Connected to MPD")
    return true
  })
  .catch(e => {
    console.log(e)
    return false
  })
}

function getState() {
  if (client) {
    return client.api.status.get()
      .then(data => {
        return {
          paused: data.state !== 'play',
          position: data.song || 0,
          elapsed: ((data.elapsed !== undefined) ? Math.round(data.elapsed) : 0),
          random: data.random
        }
      })
      .catch(e => {
        return {
          paused: false,
          position: -1,
          elapsed: 0,
          random: false
        }
      })
  } else {
    console.warn("Not connected to MPD")
    return {
      paused: false,
      position: -1,
      elapsed: 0,
      random: false
    }
  }
}

async function sendQueue (save = false) {
  if (client) {
    let items = []
    const q = await client.api.queue.info()
    const st = await client.api.status.get()
    const cur = st.song
    for (const tr of q) {
      const track = await database.tracks.trackByPath(tr.file)
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
  } else {
    console.warn("Not connected to MPD")
  }
}

async function _sendState() {
  const st = await getState()
  sendEvent(st, { event: 'status' })
}

player = {
  //playback related items
  play: async function () {
    return client.api.playback.play()
  },
  stop: async function () {
    return client.api.playback.stop()
  },
  pause: async function () {
    return client.api.playback.pause()
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
    try {
      await client.api.playback.prev()
    } catch (e) { console.log("[INFO] [Player] Error skipping backward") }
  },
  next: async function () {
    try {
      await client.api.playback.next()
    } catch (e) { console.log("[INFO] [Player] Error skipping forward") }
  },
  jump: async function (pos) {
    try {
      await client.api.playback.play(pos)
    } catch (e) { console.log(`[ERROR] [Player] Can't change to track ${ pos }`); console.log(e) }
    sendQueue()
  },
  clear: async function () {
    try {
      await client.api.queue.clear()
    } catch (e) { console.log(`[ERROR] [Player] Can't clear queue`); console.log(e) }
    sendQueue()
  },
  shuffle: async function () {
    try {
      await client.api.queue.shuffle()
      sendQueue()
    } catch (e) { console.log("[INFO] [Player] Error setting shuffle") }
  },
  random: async function random () {
    try {
      const status = await client.api.status.get()
      await client.api.playback.random(!status.random)
      sendQueue()
    } catch (e) { console.log("[INFO] [Player] Error setting random") }
  },
  remove: async function (pos) {
    try {
      await client.api.queue.delete(pos)
    } catch (e) { console.log(`[ERROR] [Player] Can't remove track (${ pos })`); console.log(e) }
    sendQueue()
  },
  enqueue: async function (tracks) {
    for (i = 0; i < tracks.length; i++) {
      try {
        await client.api.queue.add(await database.tracks.getPath(tracks[i]))
      } catch (e) { console.log(`[ERROR] [Player] Can't add track (${ tracks[i] })`); console.log(e) }
    }
    sendQueue()
  },
  playNext: async function (tracks) {
    const st = await client.api.status.get()
    const plPos = st.song || -1
    for (i = 0; i < tracks.length; i++) {
      try {
        await client.api.queue.add(await database.tracks.getPath(tracks[i]), plPos + i + 1)
      } catch (e) { console.log(`[ERROR] [Player] Can't add track (${ tracks[i] })`); console.log(e) }
    }
    sendQueue()
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
      try {
        await client.api.queue.add(path)
      } catch (e) { console.log(`[ERROR] [Player] Can't add track (${ tracks[i] })`); console.log(e) }
    }
    try {
      await client.api.playback.play(index)
    } catch (e) { console.log("[INFO] [Player] Can't play at index (invalid)") }
    sendQueue()
  },
  sendState: async function () {
    _sendState()
    sendQueue()
  },
  isPlaying() {
    return client.api.status.get()
    .then(data => data.state === "play" )
    .catch(e => false )
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