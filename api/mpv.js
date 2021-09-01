const { mergeProps } = require('@vue/runtime-core');
const mpvAPI = require('node-mpv');
const mpv = new mpvAPI({ "audio_only": true, "auto_restart": true });

const database = require('./database')

async function init (sendEvent) {
  await mpv.start()
  mpv.on('started', async function() {
    const curTime = await mpv.getTimePosition()
    sendEvent({ status: 'play', elapsed_seconds: curTime }, { event: 'play' })
  })
  mpv.on('stopped', async function() {
    const curTime = await mpv.getTimePosition()
    sendEvent({ status: 'play', elapsed_seconds: curTime }, { event: 'stop' })
  })

  mpv.on('status', async (data) => {
    switch(data.property) {
      case 'playlist-pos':
        const pos = await mpv.getPlaylistPosition()
        sendEvent({ position: pos }, { event: 'pos' })
        break
      case 'playlist-count':
        //const pl = await mpv.getPlaylist()
        //console.log(pl)
        //sendEvent(pl, { event: 'playlist' })
        break
      case 'pause':
        const curTime = await mpv.getTimePosition()
        sendEvent({ state: data.value, elapsed_seconds: curTime }, { event: 'pause' })
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
  const size = await mpv.getPlaylistSize()
  const cur = await mpv.getPlaylistPosition()
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
      playing: ((i === cur) ? true : false)
    })
    paths.push(path)
  }
  writeQueue(paths, cur)
  return items
}

player = {
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
    const cur = await mpv.getPlaylistPosition()
    for (i = 0; i < tracks.length; i++) {
      await mpv.append(tracks[i])
      await mpv.playlistMove(await mpv.getPlaylistSize() - 1, cur + i + 1)
    }
    sendEvent(await getQueue(), { event: 'playlist' })
  },
  replaceAndPlay: async function (tracks, index) {
    await mpv.stop()
    await mpv.clearPlaylist()
    for (i = 0; i < tracks.length; i++) {
      await mpv.append(database.tracks.getPath(tracks[i]))
    }
    sendEvent(await getQueue(), { event: 'playlist' })
    await mpv.jump(index)
    mpv.play()
  },
  sendState: async function () {
    const cur = await mpv.getPlaylistPosition()
    sendEvent({
      queue: await getQueue(),
      position: cur,
      elapsed_seconds: await mpv.getTimePosition(),
      state: ((cur == -1) ? 'stop' : ((await mpv.isPaused() === true) ? 'pause' : 'play'))
    }, { event: 'state' })
  }
}

module.exports = {
  init,
  player,
}
