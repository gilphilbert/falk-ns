<template>
  <div class="dropdown is-right" :class="{ 'is-active': this.isActive }">
    <span @click="isActive = !isActive" v-click-away="clickedAway">
      <svg class="feather">
        <use xlink:href="/img/feather-sprite.svg#more-vertical"></use>
      </svg>
    </span>
    <div class="dropdown-content" @click="isActive = false">
      <span class="dropdown-item" @click="$player.enqueue([this.trackID])">Enqueue</span>
      <span class="dropdown-item" @click="$player.playNext([this.trackID])">Play next</span>
      <!--<span class="dropdown-item" @click="$player.playFromHere([this.trackID])">Play from here</span>-->
      <span class="dropdown-item" @click="$emit('playFromHere', index)">Play from here</span>
      <span class="dropdown-item" @click="$emit('addToPlaylist', this.trackID)">Add to playlist</span>
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
    }
  }
}
</script>