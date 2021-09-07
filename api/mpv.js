const { mergeProps } = require('@vue/runtime-core');
const mpvAPI = require('node-mpv');
const mpv = new mpvAPI({ "audio_only": true, "auto_restart": true }, ["--keep-open=yes" ]);

const database = require('./database')

async function init (sendEvent) {
  try {
    await mpv.start()
  } catch (e) {
    console.log("[ERROR] [Player] Can't start mpv")
  }
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
        break
      case 'pause':
        const curTime = await mpv.getTimePosition()
        sendEvent({ state: data.value, elapsed_seconds: curTime }, { event: 'pause' })
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
  /*
  fs.writeFile('data/playlist.json', JSON.stringify(data), function (err,data) {
    if (err) {
      return console.log(err);
    }
    console.log(data);
  })
  */
}

async function getQueue () {
  //const nextTrackFile = await this.getProperty(`playlist/${position}/filename`);
  try {
    const size = await mpv.getPlaylistSize()
    let plPos = -1
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

async function isPlaylistComplete () {
  const size = await mpv.getPlaylistSize()

  let plPos = -1
  try {
   plPos = await mpv.getPlaylistPosition()
  } catch (e) { console.log("[INFO] [Player] Can't get playlist position") }
  
  const rem = await mpv.getTimeRemaining()
  const pau = await mpv.isPaused()
  if (size !== plPos && rem === 0 && pau === true)
    return true
  else
    return false
}

player = {
  play: async function () {
    const reset = await isPlaylistComplete()
    if (reset)
      mpv.jump(0)
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
      if (await isPlaylistComplete()) {
        mpv.jump(0)
        mpv.play()
        return
      }
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
    for (i = 0; i < tracks.length; i++) {
      await mpv.append(tracks[i])
      await mpv.playlistMove(await mpv.getPlaylistSize() - 1, plPos + i + 1)
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
  }
}

module.exports = {
  init,
  player,
}
