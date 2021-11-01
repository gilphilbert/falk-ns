const mpvAPI = require('node-mpv');
const { isDataView } = require('util/types');
const mpv = new mpvAPI({ "audio_only": true, "auto_restart": true }, ["--keep-open=yes", "--gapless-audio=weak" ]);

const database = require('./database')

async function init (sendEvent) {
  // start the mpv instance
  try {
    await mpv.start()
  } catch (e) {
    console.log("[ERROR] [Player] Can't start mpv")
  }

  // try to restore the queue
  try {
    // in case we're taking over an existing MPV instance
    await mpv.clear()

    plDataRaw = await readQueue()
    plData = JSON.parse(plDataRaw)
    
    for (let i = 0; i < plData.files.length; i++) {
      await mpv.append(plData.files[i])
    }
    sendEvent(await getQueue(), { event: 'playlist' })

    try {
      await mpv.jump(plData.queuepos)
    } catch (e) { console.log("[INFO] [Player] Can't set queue position") }

    await mpv.pause()
    sendEvent({ position: plData.queuepos }, { event: 'pos' })
  } catch (e) { console.log("[INFO] [Player] Can't restore queue") }

  // attach mpv events
  mpv.on('started', async function() {
    let curTime = 0
    try {
      curTime = await mpv.getTimePosition()
    } catch (e) { console.log("[INFO] [Player] Can't get time position") }
    sendEvent({ status: 'play', elapsed_seconds: curTime }, { event: 'play' })
  })
  mpv.on('stopped', async function() {
    sendEvent({ status: 'play', elapsed_seconds: 0 }, { event: 'stop' })
  })

  mpv.on('status', async (data) => {
    switch(data.property) {
      case 'playlist-pos':
      case 'pause':
        _sendState()
        break
      case 'playlist-count': // handled when we add/remove items
      case 'filename':
      case 'path':
      case 'media-title':
      case 'duration':
        break
      default:
        console.log(data)
    }
  })

}

fs = require('fs')
function writeQueue() {
  // get paths, pos
  data = {
    files: paths,
    queuepos: pos,
    // probably need loop and shuffle state here too
  }
  try {
    fs.writeFileSync('data/playlist.json', JSON.stringify(data))
  } catch (e) {
    console.log("[INFO] [Player] Can't save queue")
    return console.log(err);
  }
  console.log("[INFO] [Player] Saved queue")
}

async function readQueue() {
  return new Promise((resolve, reject) => {
    fs.readFile('data/playlist.json', 'utf8', function (err,data) {
      if (err) {
        console.log("[INFO] [Player] Can't read queue")
        reject(err)
      }
      resolve(data)
    })
  })
}

async function sendQueue (save = false) {
  try {
    const size = await mpv.getPlaylistSize()
    let plPos = 0
    try {
     plPos = await mpv.getPlaylistPosition()
    } catch (e) { console.log("[INFO] [Player] Can't get playlist position") }
    let items = []
    let paths = []
    for (i = 0; i < size; i++) {
      const path = await mpv.getProperty(`playlist/${i}/filename`)
      const track = await database.tracks.trackByPath(path)
      items.push({
        title: track.title,
        artist: track.albumartist,
        duration: track.duration,
        album: track.album,
        art: track.coverart,
        discart: track.discart,
        playing: ((i === plPos) ? true : false),
        shortformat: (track.samplerate / 1000) + 'kHz ' + ((track.bits) ? track.bits + 'bit' : ''),
      })
      paths.push(path)
    }

    sendEvent({ queue: items, state: await getState() }, { event: 'queue' })
    return items
  } catch (e) {
    console.log(e)
    return null
  }
}

async function getState() {
  let paused = false
  let position = -1
  let duration = 0
  let elapsed = 0
  let timerem = 0
  let percent = 0
  try { paused = await mpv.isPaused() } catch (e) {}
  try { position = await mpv.getPlaylistPosition() } catch (e) {}
  try { duration = await mpv.getDuration() } catch (e) {}
  try { elapsed = await mpv.getTimePosition() } catch (e) {}
  try { timerem = await mpv.getTimeRemaining() } catch (e) {}
  try { percent = await mpv.getPercentPosition() } catch (e) {}
  const data = {
    paused,
    position,
    duration,
    elapsed,
    remaining: timerem,
    percent
  }
  return data
}

async function _sendState(send) {
  data = await getState()
  sendEvent(data, { event: 'status' })
}

// check this function
async function isPlaylistComplete () {
  try {
    const pau = await mpv.isPaused()
    if (!pau) {
      return false
    }

    const rem = await mpv.getTimeRemaining()
    if (rem > 0) {
      return false
    }

    let plSize = -1
    try {
      plSize = await mpv.getPlaylistSize()
    } catch (e) { console.log("[INFO] [Player] Can't get playlist size") }

    let plPos = -1
    try {
    plPos = await mpv.getPlaylistPosition()
    } catch (e) { console.log("[INFO] [Player] Can't get playlist position") }

    if (plSize !== plPos)
      return false
  } catch(e) {
    return false
  }
  return true
}

player = {
  //playback related items
  play: async function () {
    try {
      await mpv.play()
    } catch (e) { console.log("[INFO] [Player] Error playing") }
  },
  stop: async function () {
    try {
      await mpv.stop()
    } catch (e) { console.log("[INFO] [Player] Error stopping") }
  },
  pause: async function () {
    try {
      await mpv.pause()
    } catch (e) { console.log("[INFO] [Player] Error pausing") }
  },
  toggle: async function () {
    if (await mpv.isPaused()) {
      try {
        await mpv.resume()
      } catch (e) { console.log("[INFO] [Player] Error resuming") }
    } else {
      try {
        await mpv.pause()
      } catch (e) { console.log("[INFO] [Player] Error pausing") }
    }
  },
  prev: async function () {
    try {
      await mpv.prev()
    } catch (e) { console.log("[INFO] [Player] Error skipping back") }
  },
  next: async function () {
    try {
      await mpv.next()
    } catch (e) { console.log("[INFO] [Player] Error skipping forward") }
  },
  jump: async function (pos) {
    try {
      await mpv.jump(pos)
    } catch (e) { console.log("[INFO] [Player] Error jumping") }
  },
  clear: async function () {
    try {
      await mpv.clearPlaylist()
      sendEvent(await getQueue(), { event: 'playlist' })
    } catch (e) { console.log("[INFO] [Player] Error clearing playlist") }
  },
  shuffle: async function () {
    try {
      await mpv.shuffle()
      //sendEvent(await getQueue(), { event: 'playlist' })
      sendQueue()
    } catch (e) { console.log("[INFO] [Player] Error shuffling") }
  },
  remove: async function (pos) {
    try {
      await mpv.playlistRemove(pos)
      //sendEvent(await getQueue(), { event: 'playlist' })
      sendQueue()
    } catch (e) {}
  },
  enqueue: async function (tracks) {
    for (i = 0; i < tracks.length; i++) {
      await mpv.append(await database.tracks.getPath(tracks[i]))
    }
    //sendEvent(await getQueue(), { event: 'playlist' })
    sendQueue()
  },
  playNext: async function (tracks) {
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
  },
  replaceAndPlay: async function (tracks, index) {
    try {
      await mpv.stop()
    } catch (e) { console.log("[INFO] [Player] Can't stop player") }

    try {
      await mpv.clearPlaylist()
    } catch (e) { console.log("[INFO] [Player] Can't clear playlist") }

    for (i = 0; i < tracks.length; i++) {
      try {
        await mpv.append(await database.tracks.getPath(tracks[i]))
      } catch (e) { console.log(`[ERROR] [Player] Can't add track (${ tracks[i] })`) }
    }
    //sendEvent(await getQueue(), { event: 'playlist' })
    try {
      await mpv.jump(index)
    } catch (e) { console.log("[INFO] [Player] Can't set playlist index (invalid)") }
    sendQueue()

    mpv.play()
  },
  sendState: async function () {
    _sendState()
    sendQueue()
    /*
    try {
      let plPos = -1
      try {
       plPos = await mpv.getPlaylistPosition()
      } catch (e) { console.log("[INFO] [Player] Can't get playlist position") }

      let queue = []
      try {
        queue = await getQueue()
      } catch (e) {}

      let curTime = 0
      try {
        curTime = await mpv.getTimePosition()
      } catch (e) {}
      sendEvent({
        queue: queue,
        position: plPos,
        elapsed_seconds: curTime,
        state: ((plPos == -1) ? 'stop' : ((await mpv.isPaused() === true) ? 'pause' : 'play'))
      }, { event: 'state' })
    } catch (e) {
      console.log(e)
    }
    */
  },

  // settings related items
  devices: async function () {
    const devices = await mpv.getProperty(`audio-device-list`)
    console.log(devices)
    return devices
  }
}

function shutdown() {
  console.log("[INFO] [Player] Shutting down...")
  //writeQueue()
  console.log("Done.")
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

module.exports = {
  init,
  player
}