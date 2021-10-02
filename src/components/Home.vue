<template>
  <div class="container-fluid max" v-touch:swipe.top="showQueue">
    <div class="background-container hidden--to-desktop" v-if="this.playback.queue[this.playback.queuePos] && this.playback.queue[this.playback.queuePos].art.background !== ''" >
      <figure class="image"><img :src=" '/art/' + ((this.playback.queue[this.playback.queuePos]) ? this.playback.queue[this.playback.queuePos].art.background + '?size=full' : '')"></figure>
    </div>
    <div class="row">
      <div class="col-xs-10 col-md-3 has-margin-auto art">
        <figure id="home-albumart" class="image is-1by1"><img :src=" '/art/' + ((this.playback.queue[this.playback.queuePos]) ? this.playback.queue[this.playback.queuePos].art.cover : 'placeholder.png') + '?size=600'" style="z-index: 1;"></figure>
        <figure id="home-albumart" class="image is-1by1" v-if="this.playback.queue[this.playback.queuePos] && this.playback.queue[this.playback.queuePos].art.disc !== ''" style="margin-top: -65%; background-color: transparent;"><img :class="{ 'rotate': this.playback.isPlaying }" :src="'/art/' + this.playback.queue[this.playback.queuePos].art.disc + '?size=600'"></figure>
        <div id="mobile-toolbar" class="has-text-centered" v-if="this.playback.queue[this.playback.queuePos] && this.playback.queue[this.playback.queuePos].album !== ''">
          <div>
            <svg class="feather"><use xlink:href="/img/feather-sprite.svg#heart"></use></svg>
          </div>
          <div>
            <svg class="feather"><use xlink:href="/img/feather-sprite.svg#plus"></use></svg>
          </div>
        </div>
      </div>
      <div class="col-xs-10 col-xs-offset-1">
        <h1 id="home-title" class="has-text-centered has-no-overflow">{{ ((this.playback.queue[this.playback.queuePos]) ? this.playback.queue[this.playback.queuePos].title : 'Nothing playing') }}</h1>
        <p class="has-text-centered subtitle is-3 has-no-overflow hidden--to-desktop" v-if="this.playback.queue[this.playback.queuePos]">
          <router-link id="home-album" :to="{ name: 'Album', params: { artist: this.playback.queue[this.playback.queuePos].artist, album: this.playback.queue[this.playback.queuePos].album } }">{{ this.playback.queue[this.playback.queuePos].album }}</router-link>
        </p>
        <p class="has-text-centered subtitle is-3 has-no-overflow" v-if="this.playback.queue[this.playback.queuePos]">
          <router-link id="home-artist" :to="{ name: 'Artist', params: { artist: this.playback.queue[this.playback.queuePos].artist } }">{{ this.playback.queue[this.playback.queuePos].artist }}</router-link>
        </p>
        <p class="has-text-centered" v-if="this.playback.queue[this.playback.queuePos] && this.playback.queue[this.playback.queuePos].shortformat !== ''">
          <span id="home-quality" class="tag is-small">{{ this.playback.queue[this.playback.queuePos].shortformat }}</span>
        </p>
      </div>
      <div class="col-xs-10 col-xs-offset-1 hidden--for-desktop">
        <div id="mobile-progress-bar">
          <div style="width: 0px;" :style="{ width: progressWidth }"></div>
        </div>
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
    </div>
    <div class="hidden--for-desktop" id="swipe-up-queue" @click="showQueue"><svg class="feather"><use xlink:href="/img/feather-sprite.svg#chevron-up"></use></svg></div>
  </div>
</template>
<script>
export default {
  name: 'Home',
  props: [ 'playback' ],
  computed: {
    progressWidth: function () {
      if (this.playback.queue.length > 0) {
        return (this.playback.elapsed / (this.playback.queue[this.playback.queuePos].duration * 1000)) * 100 + '%'
      }
      return '0%'
    }
  },
  methods: {
    showQueue: function () {
      this.$emit('showQueue')
    }
  }
}
</script>