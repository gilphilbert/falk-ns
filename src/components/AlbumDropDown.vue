<template>
  <div class="dropdown is-right" :class="{ 'is-active': this.isActive }">
    <span @click="isActive = !isActive" v-click-away="clickedAway">
      <svg class="feather">
        <use xlink:href="/img/feather-sprite.svg#more-vertical"></use>
      </svg>
    </span>
    <div class="dropdown-content">
      <span class="dropdown-item" v-on:touchstart="enqueue" @click="enqueue">Enqueue</span>
      <span class="dropdown-item" v-on:touchstart="playNext" @click="playNext">Play next</span>
      <span class="dropdown-item" v-on:touchstart="playFromHere" @click="playFromHere">Play from here</span>
      <span class="dropdown-item" v-on:touchstart="addToPlaylist" @click="addToPlaylist">Add to playlist</span>
    </div>
  </div>
</template>

<script>

export default {
  name: 'AlbumDropDown',
  props: [ 'index', 'trackID' ],
  data () {
    return {
      isActive: false
    }
  },
  methods: {
    clickedAway() {
      this.isActive = false
    },
    enqueue() {
      this.$player.enqueue([this.trackID])
      //this.isActive = false
    },
    playNext() {
      $player.playNext([this.trackID])
      //this.isActive = false
    },
    playFromHere() {
      $emit('playFromHere', index)
      //this.isActive = false
    },
    addToPlaylist() {
      $emit('addToPlaylist', this.trackID)
      //this.isActive = false
    }
  }
}
</script>