<template>
<div :class="{ 'no-controls': this.$route.path==='/' }">
  <div id="content-container">
    <router-view v-bind:playback="playback" @showQueue="toggleQueue" ></router-view>
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
  },
  data () {
    return {
      showMenu: false,
      showControls: false,
      showQueue: false,
      noControls: false,
      playback: {
        isPlaying: false,
        queuePos: 1,
        elapsed: '53',
        queue: [
          {
            title: 'The Only Night',
            artist: 'James Morrison',
            duration: '217',
            album: 'Songs for You, Truths for Me',
            shortformat: '44.1kHz 16bit',
            cover: '/art/4be59c8690054a786e401f40177c41a76b8caee0-cover.jpg',
            discart: '/art/4be59c8690054a786e401f40177c41a76b8caee0-disc.png'
          },
          {
            title: 'Precious Love',
            artist: 'James Morrison',
            duration: '218',
            album: 'Songs for You, Truths for Me',
            shortformat: '44.1kHz 16bit',
            cover: '/art/4be59c8690054a786e401f40177c41a76b8caee0-cover.jpg',
            discart: '/art/4be59c8690054a786e401f40177c41a76b8caee0-disc.png'
          }
        ]
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