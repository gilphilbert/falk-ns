const STATE_STOP = 0
const STATE_PLAY = 1
const STATE_PAUSE = 2

const TICK = 100

const sources = []

let eventCallbacks = {}

const progressTick = TICK

/* == simple event emitter ==
//
//   attach like this:
//   player.on('play', evt => console.log(evt))
//
*/
function on (name, callback) {
  eventCallbacks = eventCallbacks || {}
  eventCallbacks[name] = eventCallbacks[name] || []
  eventCallbacks[name].push(callback)
}

function dispatchEvent (name, event) {
  eventCallbacks = eventCallbacks || {}
  if (name in eventCallbacks && eventCallbacks[name].length > 0) {
    eventCallbacks[name].forEach(callback => callback(event))
  }
}

const progress = () => {
  if (state === STATE_PLAY) {
    window.setTimeout(progress, progressTick)
    const duration = html5Audio.duration || ((sources[0]) ? sources[0].buffer.duration : null) || false
    if (duration !== false) {
      dispatchEvent('progress', new window.CustomEvent('progress', { detail: { elapsed: duration - (timeLeft - (playerContext.currentTime - startTime)), duration: duration } }))
    }
  }
}

/*
function play (index = -1) {
  fetch('/api/play')
}

function pause () {
  fetch('/api/pause')
}
*/

function toggle () {
  fetch('/api/toggle')
}

function skip () {
  fetch('/api/next')
}

function prev () {
  fetch('/api/prev')
}

function random () {
  fetch('/api/random')
}

function repeat () {
  fetch('/api/repeat')
}

async function addTrack ({ id, url, meta }) {

}

async function enqueueOne ({ id, url, meta }) {
  addTrack(id, url, meta)
}

async function enqueue (tracks) {
  let body = { tracks: tracks.map(e => e.id) }
  fetch('/api/enqueue', {
    method: 'post',
    body: JSON.stringify(body),
    headers: { 'Content-type': 'application/json; charset=UTF-8' }
  })
}

async function replaceAndPlay (tracks, playPosition = 0) {
  let body = { tracks: tracks.map(e => e.id), index: playPosition }
  fetch('/api/replaceAndPlay', {
    method: 'post',
    body: JSON.stringify(body),
    headers: { 'Content-type': 'application/json; charset=UTF-8' }
  })
}

function changePos (index) {
  fetch('/api/jump/' + index)
}

module.exports = {
  on,
  toggle,
  skip,
  prev,
  enqueue,
  enqueueOne,
  replaceAndPlay,
  random,
  repeat,
  changePos,
}
