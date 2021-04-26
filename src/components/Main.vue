<template>
<div>
  <div id="content-container">
    <router-view></router-view>
  </div>
  <Menu :isActive="showMenu" />
  <ControlBar :isActive="showControls" :playback="playback" :toggleQueue="toggleQueue" />
  <Queue :isActive="showQueue" :playback="playback" :toggleQueue="toggleQueue" />
</div>
</template>
<script>
import Menu from './Menu.vue'
import ControlBar from './ControlBar.vue'
import Queue from './Queue.vue'

import Artists from './Artists.vue'
import Albums from './Albums.vue'
import Artist from './Artist.vue'
import Album from './Album.vue'

export default {
  name: 'Main',
  components: {
    Menu,
    ControlBar,
    Queue,
    Artists,
    Albums,
    Artist,
    Album
  },
  created () {
  },
  data () {
    return {
      showMenu: false,
      showControls: false,
      showQueue: false,
      playback: {
        isPlaying: false,
        queuePos: 1,
        elapsed: '53',
        queue: [
          {
            title: 'The Only Night',
            artist: 'James Morrison',
            duration: '217',
            cover: '/art/4be59c8690054a786e401f40177c41a76b8caee0-cover.jpg',
          },
          {
            title: 'Precious Love',
            artist: 'James Morrison',
            duration: '218',
            cover: '/art/4be59c8690054a786e401f40177c41a76b8caee0-cover.jpg',
          }
        ]
      },
    }
  },
  props: [ 'isLoggedInParent' ],
  methods: {
    toggleQueue () {
      this.showQueue = !this.showQueue
    }
  }
}
</script>