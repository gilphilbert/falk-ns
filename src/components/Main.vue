<template>
<div :class="{ 'no-controls': this.$route.path==='/' }">
  <div id="content-container" v-touch:swipe.left="doHideMenu" v-touch:swipe.right="doShowMenu">
    <router-view :playback="playback" @showQueue="toggleQueue" :stats="stats" ></router-view>
  </div>
  <Menu :isActive="showMenu" @hide="doHideMenu" />
  <ControlBar :isActive="showControls" :playback="playback" @toggleQueue="toggleQueue" :online="online" v-touch:swipe.top="unhideQueue" />
  <Queue :isActive="showQueue" :playback="playback" @hideQueue="toggleQueue" />
  <div id="burger" class="hidden--for-desktop" @click="doShowMenu">
    <svg class="feather burger"><use href="/img/feather-sprite.svg#burger"></use></svg>
  </div>
</div>
</template>
<script>
import Menu from './Menu.vue'
import ControlBar from './ControlBar.vue'
import Queue from './Queue.vue'

export default {
  name: 'Main',
  components: {
    Menu,
    ControlBar,
    Queue
  },
  created () {
    //this.$player.on('play', () => { this.playback.isPlaying = true })
    //this.$player.on('pause', () => { this.playback.isPlaying = false })
    //this.$player.on('queue', q => { this.playback.queue = q.queue; this.playback.queuePos = q.pos })
    //this.$player.on('progress', p => this.playback.elapsed = p.detail.elapsed)
    //this.$player.on('stop', () => this.playback.elapsed = 0)

    this.$database.getStats()
      .then(data => this.stats = data)

    //set up the event listener
    const events = new EventSource('/events')
    events.onmessage = function(e) {
      console.log(e)
    }
    events.addEventListener('open', evt => {
      this.online = true
      console.log("SSE Connected")
    })
    events.addEventListener('error', evt => {
      this.online = false
    })
    events.addEventListener('state', evt => {
      const data = JSON.parse(evt.data)
      this.playback.queuePos = data.position
      this.playback.queue = data.queue
      this.playback.elapsed = data.elapsed_seconds * 1000
      if (data.state === "play") {
        this.playback.isPlaying = true
      }
    })
    events.addEventListener('play', evt => {
      const data = JSON.parse(evt.data)
      this.playback.elapsed = data.elapsed_seconds * 1000
      this.playback.isPlaying = true
    })
    events.addEventListener('pause', evt => {
      const data = JSON.parse(evt.data)
      console.log(data)
      this.playback.elapsed = data.elapsed_seconds * 1000
      if (data.state === true) {
        this.playback.isPlaying = false
      } else {
        this.playback.isPlaying = true
      }
      console.log(this.playback.isPlaying)
    })
    events.addEventListener('stop', evt => {
      const data = JSON.parse(evt.data)
      this.playback.elapsed = data.elapsed_seconds * 1000
      this.playback.isPlaying = false
      this.playback.elapsed = 0
    })
    events.addEventListener('pos', evt => {
      const data = JSON.parse(evt.data)
      this.playback.queuePos = data.position
      if (data.position === -1) {
        this.playback.isPlaying = false
        this.playback.elapsed = 0
      }
      console.log(this.playback.isPlaying)
    })
    events.addEventListener('playlist', evt => {
      const data = JSON.parse(evt.data)
      this.playback.queue = data
    })
    events.addEventListener('update', evt => {
      const data = JSON.parse(evt.data)
      if (data.status === 'complete') {
        console.log('[SERVER] update complete')
        fetch('/api/stats').then(data => data.json()).then(data => { this.stats = data })
      }
    })
  },
  data () {
    return {
      showMenu: false,
      showControls: false,
      showQueue: false,
      noControls: false,
      playback: {
        isPlaying: false,
        queuePos: 0,
        elapsed: 0,
        queue: []
      },
      stats: {},
      online: false
    }
  },
  props: [ 'isLoggedIn' ],
  methods: {
    unhideQueue () {
      this.showQueue = true
    },
    toggleQueue () {
      this.showQueue = !this.showQueue
    },
    doShowMenu () {
      this.showMenu = true
    },
    doHideMenu () {
      this.showMenu = false
    },
    tick () {
      setTimeout(() => {
        if (this.playback.isPlaying) {
          this.playback.elapsed += 100
          this.tick()
        }
      }, 100)
    }
  },
  watch: {
    'playback.isPlaying': function () {
      if (this.playback.isPlaying)
        this.tick()
    }
  }
}
</script>
