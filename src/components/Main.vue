<template>
<div :class="{ 'no-controls': this.$route.path==='/' }">
  <div id="content-container" v-touch:swipe.left="doHideMenu" v-touch:swipe.right="doShowMenu">
    <router-view :playback="playback" @showQueue="toggleQueue" :stats="stats" ></router-view>
  </div>
  <Menu :isActive="showMenu" @hide="doHideMenu" :scanPercent="scanPercent" :scanning="scanning" />
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

    events.addEventListener('queue', evt => {
      const data = JSON.parse(evt.data)
      console.log(data)

      this.playback.queue = data.queue

      this.playback.queuePos = data.state.position

      let elapsed = data.state.elapsed * 1000
      if (elapsed < 0)
        elapsed = 0
      this.playback.elapsed = elapsed
      this.playback.isPlaying = ((data.state.position !== -1 && !data.state.paused) ? true : false)
    })

    events.addEventListener('status', evt => {
      const data = JSON.parse(evt.data)
      this.playback.queuePos = data.position

      let elapsed = data.elapsed * 1000
      if (elapsed < 0)
        elapsed = 0
      this.playback.elapsed = elapsed
      this.playback.isPlaying = ((data.position !== -1 && !data.paused) ? true : false)
    })

    events.addEventListener('scanner', evt => {
      const data = JSON.parse(evt.data)
      const keys = Object.keys(data)
      if (keys.includes('toScan')) {
        console.log(data)
        this.scanPercent = Math.round((data.scanned / data.toScan) * 100)
        if (this.scanned > this.stats.songs) {
          this.stats.songs = this.scanned
        }
        this.stats.songs = data.scanned
        this.scanning = true
      }
      if (keys.includes('status')) {
        if (data.status === 'started') {
          this.scanning = true
        } else
        if (data.status === 'stopped') {
          this.scanning = false
          this.scanPercent = 0
          this.$database.getStats()
            .then(data => this.stats = data)
        }
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
      online: false,
      scanPercent: 0,
      scanning: false,
      timer: null,
      lastTimeUpdate: 0
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
      const newTime = new Date().getTime()
      this.playback.elapsed += (newTime - this.lastTimeUpdate)
      this.lastTimeUpdate = newTime
    }
  },
  watch: {
    'playback.isPlaying': function () {
      if (this.playback.isPlaying) {
        this.lastTimeUpdate = new Date().getTime()
        this.timer = setInterval(()=>{
          this.tick()
        },100)
      } else {
        clearInterval(this.timer)
      }
    }
  }
}
</script>
