<template>
<div :class="{ 'no-controls': this.$route.path==='/' }">
  <div id="content-container" v-touch:swipe.left="doHideMenu" v-touch:swipe.right="doShowMenu">
    <router-view :playback="playback" @showQueue="toggleQueue" :stats="stats" ></router-view>
  </div>
  <Menu :isActive="showMenu" @hide="doHideMenu" @doLogout="doLogout" />
  <ControlBar :isActive="showControls" :playback="playback" @toggleQueue="toggleQueue" :online="online" />
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

    //this.stats = this.$database.getStats()
    fetch('/api/stats').then(data => data.json()).then(data => { this.stats = data })

    //set up the event listener
    const events = new EventSource('/events')
    events.onmessage = function(e) {
      console.log(e)
    }
    events.addEventListener('open', evt => {
      this.online = true
      console.log("connected")
    })
    events.addEventListener('error', evt => {
      this.online = false
    })
    events.addEventListener('play', evt => {
      console.log('play')
      this.playback.isPlaying = true
    })
    events.addEventListener('stop', evt => {
      console.log('stop')
      this.playback.isPlaying = false
      this.playback.elapsed = 0
    })
    events.addEventListener('pos', evt => {
      const data = JSON.parse(evt.data)
      console.log(data)
      this.playback.queuePos = data.pos
    })
    events.addEventListener('playlist', evt => {
      const data = JSON.parse(evt.data)
      console.log(data)
      this.playback.queue = data
      //this.playback.queuePos = data.pos
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
    toggleQueue (fixed = null) {
      this.showQueue = !this.showQueue
    },
    doShowMenu () {true
      this.showMenu = true
    },
    doHideMenu () {
      this.showMenu = false
    },
    doLogout () {
      fetch('/api/logout')
        .then(() => {
          this.$emit('loggedOut')
        })
    }
  }
}
</script>