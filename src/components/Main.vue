<template>
<div :class="{ 'no-controls': this.$route.path==='/' }">
  <div id="content-container" v-touch:swipe.left="() => { showMenu = true }" v-touch:swipe.right="() => { showMenu = false }">
    <router-view :playback="playback" @showQueue="toggleQueue" ></router-view>
  </div>
  <Menu :isActive="showMenu" />
  <ControlBar :isActive="showControls" :playback="playback" @toggleQueue="toggleQueue" />
  <Queue :isActive="showQueue" :playback="playback" @hideQueue="toggleQueue" />
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
    this.$player.on('queue', (q) => { this.playback.queue = q.queue; this.playback.queuePos = q.pos })
    this.$player.on('progress', p => this.playback.elapsed = p.detail.elapsed)
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
    }
  },
  props: [ 'isLoggedInParent' ],
  methods: {
    toggleQueue (fixed = null) {
      this.showQueue = !this.showQueue
    }
  }
}
</script>