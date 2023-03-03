<template>
  <div class="dropdown is-right" :class="{ 'is-active': this.isActive }" v-click-away="clickedAway">
    <span @click="isActive = !isActive">
      <svg class="feather">
        <use xlink:href="/img/feather-sprite.svg#more-vertical"></use>
      </svg>
    </span>
    <div class="dropdown-content">
      <span v-if="!$settings.get('enqueueOnClick')" class="dropdown-item" @click="enqueue">Enqueue</span> <!-- -->
      <span class="dropdown-item" @click="playNext">Play next</span> <!-- -->
      <span v-if="$settings.get('enqueueOnClick')" class="dropdown-item" @click="replaceAndPlay">Clear and play</span> <!-- -->
      <span class="dropdown-item" @click="playFromHere">Play from here</span>
      <span class="dropdown-item" @click="addToPlaylist">Add to playlist</span>
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
    clickedAway(event) {
      let node = event.target
      if (! node.classList.contains('dropdown-item') && ! node.classList.contains('dropdown-content')) {
        this.isActive = false
      }
    },
    enqueue() {
      this.$player.enqueue([this.trackID])
      this.isActive = false
    },
    replaceAndPlay() {
      this.$player.replaceAndPlay([this.trackID])
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