<template>
  <div id="queue-list" :class="{ 'is-active': isActive }">
    <div id="queue-header" @click="hideQueue" v-touch:swipe.bottom="hideQueue">
      <h1>Play Queue</h1>
    </div>
    <div id="queue-items">
      <div class="row middle-xs" v-for="(item, index) in playback.queue" :key="index" :class="{ 'is-playing': index === playback.queuePos }" style="position: relative; overflow: hidden">
        <div class="progress" v-if="index == playback.queuePos" :style="{ width: Math.round(playback.elapsed / (playback.queue[playback.queuePos].duration * 1000) * 1000) / 10 + '%' }"></div>
        <div class="col-xs no-grow" @click="$player.changePos(index)"><figure class="image is-40x40"><img v-bind:src="((item.art) ? item.art : '/img/placeholder.png')" load="lazy"></figure></div>
        <div class="col-xs" @click="$player.changePos(index)"><p class="is-5 is-capitalized">{{ item.title }}</p><p class="subtitle is-5 is-capitalized">{{ item.artist + ' - ' + (Math.floor(item.duration / 60) + ':' + ('0' + (item.duration % 60)).slice(-2, 3)) }}</p></div>
        <div class="col-xs no-grow" @click="$player.remove(index)"><p><span class="delete"><svg class="feather delete"><use xlink:href="/img/feather-sprite.svg#x-circle"></use></svg></span></p></div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Queue',
  props: [ 'isActive', 'playback' ],
  methods: {
    hideQueue () {
      this.$emit('hideQueue')
    }
  }
}
</script>