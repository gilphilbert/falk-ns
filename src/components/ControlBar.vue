<template>
  <div id="control-bar" class="is-active" data-bind="swipeup: showQueue">
    <div class="progress-topper" v-if="this.playback.queue[this.playback.queuePos]" :style="{ width: (playback.elapsed / playback.queue[playback.queuePos].duration * $innerWidth) + 'px' }"></div>
    <div class="row is-marginless">
      <div class="col-xs col-md">
        <div class="row now-playing">
          <div class="col-xs is-narrow">
            <figure class="image is-70x70">
              <img v-bind:src="'/art/' + ((this.playback.queue[this.playback.queuePos]) ? this.playback.queue[this.playback.queuePos].art.cover : 'placeholder.png')">
            </figure>
          </div>
          <div class="col-xs">
            <p class="is-5">{{ ((this.playback.queue[this.playback.queuePos]) ? this.playback.queue[this.playback.queuePos].title : 'Not playing') }}</p>
            <p class="subtitle is-5" v-if="this.playback.queue[this.playback.queuePos]"><router-link class="subtitle is-5" :to="'/artist/' + this.playback.queue[this.playback.queuePos].artist">{{ this.playback.queue[this.playback.queuePos].artist }}</router-link></p>
          </div>
        </div>
      </div>
      <div class="col-xs no-grow col-md playing-controls misc-controls">
        <svg class="random feather hidden--to-desktop" @click="this.$player.random"><use href="/img/feather-sprite.svg#shuffle"></use></svg>
        <svg class="feather prev" @click="this.$player.prev"><use href="/img/feather-sprite.svg#skip-back"></use></svg>
        <span class="play-button pointer" @click="this.$player.toggle">
          <svg class="feather" :class="{ 'is-hidden': playback.isPlaying }"><use href="/img/feather-sprite.svg#play"></use></svg>
          <svg class="feather" :class="{ 'is-hidden': !playback.isPlaying }"><use href="/img/feather-sprite.svg#pause"></use></svg>
        </span>
        <svg class="feather next" @click="this.$player.skip"><use href="/img/feather-sprite.svg#skip-forward"></use></svg>
        <svg class="repeat feather hidden--to-desktop" @click="this.$player.repeat"><use href="/img/feather-sprite.svg#repeat"></use></svg>
      </div>
      <div class="col-md has-text-right hidden--to-desktop">
        <div class="row end-md">
          <div class="col-md no-grow play-progress">
            <span>{{ Math.floor(playback.elapsed / 60) + ':' + ('0' + (Math.round(playback.elapsed) % 60)).slice(-2, 3) }}</span>/<span>{{ ((this.playback.queue[this.playback.queuePos]) ? Math.floor(this.playback.queue[this.playback.queuePos].duration / 60) + ':' + ('0' + (this.playback.queue[this.playback.queuePos].duration % 60)).slice(-2, 3) : '0:00') }}</span>
          </div>
          <div class="col-md no-grow">
            <svg class="queue feather hidden--to-desktop" @click="toggleQueue"><use href="/img/feather-sprite.svg#queue-alt"></use></svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'ControlBar',
  props: [ 'isActive', 'playback' ],
  methods: {
    toggleQueue () {
      this.$emit('toggleQueue')
    }
  }
}
</script>