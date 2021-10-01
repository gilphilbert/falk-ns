<template>
  <div class="dropdown is-right" :class="{ 'is-active': this.isActive }">
    <span @click="isActive = !isActive" v-click-away="clickedAway">
      <svg class="feather">
        <use xlink:href="/img/feather-sprite.svg#more-vertical"></use>
      </svg>
    </span>
    <div class="dropdown-content" @click="isActive = false">
      <span class="dropdown-item">Play from here</span>
      <span class="dropdown-item">Enqueue</span>
      <span class="dropdown-item" @click="$emit('removeTrack', this.index)">Remove from playlist</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlaylistDropDown',
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