<template>
<div :class="{ 'no-controls': this.$route.path==='/' }">
  <div id="content-container" v-touch:swipe.left="doHideMenu" v-touch:swipe.right="doShowMenu">
    <router-view :playback="playback" @showQueue="toggleQueue" ></router-view>
  </div>
  <Menu :isActive="showMenu" @hide="doHideMenu" />
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
    }
  }
}
</script>