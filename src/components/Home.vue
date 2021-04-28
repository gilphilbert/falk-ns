<template>
  <div class="container-fluid max" data-bind="swipeup: showQueue">
    <div class="row">
      <div class="col-xs-10 col-md-3 has-margin-auto art">
        <figure id="home-albumart" class="image is-1by1"><img :src="this.cover" style="z-index: 1;"></figure>
        <figure id="home-albumart" class="image is-1by1" v-if="this.discart !== ''" style="margin-top: -65%; background-color: transparent;"><img :class="{ 'rotate': this.playback.isPlaying }" :src="this.discart"></figure>
        <div id="mobile-toolbar" class="has-text-centered" data-bind="if: playing.album() !== ''">
          <div>
            <svg class="feather"><use xlink:href="/img/feather-sprite.svg#heart"></use></svg>
          </div>
          <div>
            <svg class="feather"><use xlink:href="/img/feather-sprite.svg#plus"></use></svg>
          </div>
        </div>
      </div>
      <div class="col-xs-10 col-xs-offset-1">
        <h1 id="home-title" class="has-text-centered has-no-overflow">{{ this.title }}</h1>
        <p class="has-text-centered subtitle is-3 has-no-overflow hidden--to-desktop">
          <router-link id="home-album" :to="'/album/' + this.artist + '/' + this.album">{{ this.album }}</router-link>
        </p>
        <p class="has-text-centered subtitle is-3 has-no-overflow">
          <router-link id="home-artist" :to="'/artist/' + this.artist">{{ this.artist }}</router-link>
        </p>
        <p class="has-text-centered" v-if="this.shortformat !== ''">
          <span id="home-quality" class="tag is-small">{{ this.shortformat }}</span>
        </p>
      </div>
      <div id="mobile-controls" class="col-xs-12 mobile-controls hidden--for-desktop">
        <span><svg class="feather random is-small"><use xlink:href="/img/feather-sprite.svg#shuffle"></use></svg></span>
        <span><svg class="feather"><use xlink:href="/img/feather-sprite.svg#skip-back"></use></svg></span>
        <button class="button is-primary is-rounded has-no-margin">
          <svg class="feather" :class="{ 'is-hidden': this.playback.isPlaying }" ><use href="/img/feather-sprite.svg#play"></use></svg>
          <svg class="feather" :class="{ 'is-hidden': !this.playback.isPlaying }"><use href="/img/feather-sprite.svg#pause"></use></svg>
        </button>
        <span><svg class="feather"><use xlink:href="/img/feather-sprite.svg#skip-forward"></use></svg></span>
        <span><svg class="feather repeat is-small"><use xlink:href="/img/feather-sprite.svg#repeat"></use></svg></span>
      </div>
      <div class="col-xs-10 col-xs-offset-1 hidden--for-desktop">
        <div id="mobile-progress-bar">
          <div style="width: 0px;"></div>
        </div>
      </div>
    </div>
    <div class="hidden--for-desktop" id="swipe-up-queue" @click="showQueue"><svg class="feather"><use xlink:href="/img/feather-sprite.svg#chevron-up"></use></svg></div>
  </div>
</template>
<script>
export default {
  name: 'Home',
  props: [ 'playback' ],
  created () {
    if (this.playback.queue.length > 0) {
      const track = this.playback.queue[this.playback.queuePos]
      this.title = track.title
      this.artist = track.artist
      this.album = track.album
      this.shortformat = track.shortformat
      this.duration = track.duration
      this.cover = track.cover
      this.discart = track.discart
    } else {
      //placeholders
    }
  },
  methods: {
    showQueue () {
      this.$emit('showQueue', true)
    }
  }
}
</script>