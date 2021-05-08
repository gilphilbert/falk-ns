<template>
<div :class="{ 'no-controls': this.$route.path==='/' }">
  <div id="content-container" v-touch:swipe.left="doHideMenu" v-touch:swipe.right="doShowMenu">
    <router-view :playback="playback" @showQueue="toggleQueue" :stats="stats" ></router-view>
  </div>
  <Menu :isActive="showMenu" @hide="doHideMenu" @doLogout="doLogout" />
  <ControlBar :isActive="showControls" :playback="playback" @toggleQueue="toggleQueue" />
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
    this.$player.on('play', () => { this.playback.isPlaying = true })
    this.$player.on('pause', () => { this.playback.isPlaying = false })
    this.$player.on('queue', q => { console.log(q); this.playback.queue = q.queue; this.playback.queuePos = q.pos })
    this.$player.on('progress', p => this.playback.elapsed = p.detail.elapsed)
    this.$player.on('stop', () => this.playback.elapsed = 0)

    this.stats = this.$database.getStats()

    //set up the event listener
    const events = new window.EventSource('/events')
    events.addEventListener('update', (evt) => {
      const data = JSON.parse(evt.data)
      if (data.status === 'complete') {
        console.log('[SERVER] update complete')
        this.$database.update(() => { this.stats = this.$database.getStats() })
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
      stats: {}
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