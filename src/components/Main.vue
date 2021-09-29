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
      this.playback.elapsed = data.state.elapsed * 1000
      this.playback.isPlaying = ((data.state.position !== -1 && !data.state.paused) ? true : false)
    })

    events.addEventListener('status', evt => {
      const data = JSON.parse(evt.data)
      console.log(data)
      this.playback.queuePos = data.position
      this.playback.elapsed = data.elapsed * 1000
      this.playback.isPlaying = ((data.position !== -1 && !data.paused) ? true : false)
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
