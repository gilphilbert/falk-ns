const { mergeProps } = require('@vue/runtime-core');
const mpvAPI = require('node-mpv');
const mpv = new mpvAPI({ "audio_only": true, "auto_restart": true });

const database = require('./database')

async function init (sendEvent) {
  await mpv.start()
  mpv.on('started', function() {
    sendEvent({ status: 'play' }, { event: 'play' })
  })
  mpv.on('stopped', function() {
    sendEvent({ status: 'play' }, { event: 'stop' })
  })

  mpv.on('status', async (data) => {
    console.log(data)
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
    }
  })

}

async function getQueue () {
  //const nextTrackFile = await this.getProperty(`playlist/${position}/filename`);
  const size = await mpv.getPlaylistSize()
  const cur = await mpv.getPlaylistPosition()
  let items = []
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
  }
  return items
}

player = {
  play: function () {
    //if (mpv.isPaused()) {
    //  mpv.resume()
    //} else {
      mpv.play()
    //}
  },
  pause: function () {
    mpv.pause()
  },
  stop: function () {
    mpv.stop()
  },
  skip: function () {
    mpv.next()
  },
  prev: function () {
    mpv.prev()
  },
  jump: function (pos) {
    mpv.jump(pos)
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
  replaceAndPlay: async function (tracks) {
    await mpv.clearPlaylist()
    for (i = 0; i < tracks.length; i++) {
      await mpv.append(tracks[i])
    }
    sendEvent(await getQueue(), { event: 'playlist' })
  },
  enqueue: async function (tracks) {
    for (i = 0; i < tracks.length; i++) {
      await mpv.append(tracks[i])
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
  }
}

module.exports = {
  init,
  player,
}
