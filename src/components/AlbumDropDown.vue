<template>
  <div class="dropdown is-right" :class="{ 'is-active': this.isActive }">
    <span @click="isActive = !isActive" v-click-away="clickedAway">
      <svg class="feather">
        <use xlink:href="/img/feather-sprite.svg#more-vertical"></use>
      </svg>
    </span>
    <div class="dropdown-content" >
      <span class="dropdown-item" @click.stop="enqueue">Enqueue</span> <!-- v-on:touchend.stop="enqueue" -->
      <span class="dropdown-item" @click.stop="playNext">Play next</span> <!-- v-on:touchend.stop="playNext" -->
      <span class="dropdown-item" @click.stop="playFromHere">Play from here</span>
      <span class="dropdown-item" @click.stop="addToPlaylist">Add to playlist</span>
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
      this.isActive = false
    },
    playNext() {
      this.$player.playNext([this.trackID])
      this.isActive = false
    },
    playFromHere() {
      this.$emit('playFromHere', this.index)
      this.isActive = false
    },
    addToPlaylist() {
      this.$emit('addToPlaylist', this.trackID)
      this.isActive = false
    }
  }
}
</script>