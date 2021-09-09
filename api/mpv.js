const { mergeProps } = require('@vue/runtime-core');
const mpvAPI = require('node-mpv');
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
    console.log(plData)
    
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
        try {
          const plPos = await mpv.getPlaylistPosition()
          sendEvent({ position: plPos }, { event: 'pos' })
        } catch (e) { console.log("[INFO] [Player] Can't get playlist position") }
        getQueue() // write the queue
        break
      case 'pause':
        const curTime = await mpv.getTimePosition()
        if (isPlaylistComplete()) {
          mpv.jump(0)
          sendEvent({ position: 0 }, { event: 'pos' })
          sendEvent({ state: data.value, elapsed_seconds: 0 }, { event: 'pause' })
        } else {
          sendEvent({ state: data.value, elapsed_seconds: curTime }, { event: 'pause' })
        }
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
async function writeQueue(paths, pos) {
  data = {
    files: paths,
    queuepos: pos,
    // probably need loop and shuffle state here too
  }
  fs.writeFile('data/playlist.json', JSON.stringify(data), function (err,data) {
    if (err) {
      console.log("[INFO] [Player] Can't save queue")
      return console.log(err);
    }
    //console.log(data);
  })
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

async function getQueue () {
  //const nextTrackFile = await this.getProperty(`playlist/${position}/filename`);
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
      const track = database.tracks.trackByPath(path)
      items.push({
        title: track.info.title,
        artist: track.info.albumartist,
        duration: track.info.duration,
        art: track.info.art,
        id: track.id,
        playing: ((i === plPos) ? true : false)
      })
      paths.push(path)
    }
    writeQueue(paths, plPos)
    return items
  } catch (e) {
    console.log(e)
    return null
  }
}

// check this function
async function isPlaylistComplete () { 
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

  return true
}

player = {
  //playback related items
  play: async function () {
    await mpv.play()
  },
  stop: async function () {
    await mpv.stop()
  },
  pause: async function () {
    await mpv.pause()
  },
  toggle: async function () {
    if (await mpv.isPaused()) {
      mpv.resume()
    } else {
      mpv.pause()
    }
  },
  prev: async function () {
    await mpv.prev()
  },
  next: async function () {
    await mpv.next()
  },
  jump: async function (pos) {
    await mpv.jump(pos)
  },
  clear: async function () {
    await mpv.clearPlaylist()
    sendEvent(await getQueue(), { event: 'playlist' })
  },
  shuffle: async function () {
    await mpv.shuffle()
    sendEvent(await getQueue(), { event: 'playlist' })
  },
  remove: async function () {
    await mpv.playlistRemove(pos)
    sendEvent(await getQueue(), { event: 'playlist' })
  },
  enqueue: async function (tracks) {
    for (i = 0; i < tracks.length; i++) {
      await mpv.append(database.tracks.getPath(tracks[i]))
    }
    sendEvent(await getQueue(), { event: 'playlist' })
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

    for (i = 0; i < tracks.length; i++) {
      await mpv.append(tracks[i])
      await mpv.playlistMove(plSize - 1, plPos + i + 1)
    }
    sendEvent(await getQueue(), { event: 'playlist' })
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
        await mpv.append(database.tracks.getPath(tracks[i]))
      } catch (e) { console.log(`[ERROR] [Player] Can't add track (${ tracks[i] })`) }
    }
    sendEvent(await getQueue(), { event: 'playlist' })
    try {
      await mpv.jump(index)
    } catch (e) { console.log("[INFO] [Player] Can't set playlist index (invalid)") }

    mpv.play()
  },
  sendState: async function () {
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
  },
  loadPlaylist: async function () {
    // get the playlist from the database
    // load the files, start playing
  },

  // settings related items
  devices: async function () {
    const devices = await mpv.getProperty(`audio-device-list`)
    console.log(devices)
    return devices
  }
}

process.on('SIGTERM', async function () {
  await mpv.stop()
})

module.exports = {
  init,
  player
}