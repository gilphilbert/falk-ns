<template>
  <div id="control-bar" class="is-active" data-bind="swipeup: showQueue">
    <div class="progress-topper" :style="{ width: (playback.elapsed / playback.queue[playback.queuePos].duration * $innerWidth) + 'px' }"></div>
    <div class="row is-marginless">
      <div class="col-xs col-md">
        <div class="row now-playing">
          <div class="col-xs is-narrow">
            <figure class="image is-70x70">
              <img v-bind:src="playback.queue[playback.queuePos].cover">
            </figure>
          </div>
          <div class="col-xs">
            <p class="is-5">{{ playback.queue[playback.queuePos].title }}</p>
            <p class="subtitle is-5">{{ playback.queue[playback.queuePos].artist }}</p>
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
            <span>{{ Math.floor(playback.elapsed / 60) + ':' + ('0' + (playback.elapsed % 60)).slice(-2, 3) }}</span>/<span>{{ Math.floor(playback.queue[playback.queuePos].duration / 60) + ':' + ('0' + (playback.queue[playback.queuePos].duration % 60)).slice(-2, 3) }}</span>
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
  props: [ 'isActive', 'player', 'playback', 'toggleQueue' ]
}
</script>