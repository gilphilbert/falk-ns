<template>
  <div id="queue-list" :class="{ 'is-active': isActive }">
    <div id="queue-header" @click="hideQueue">
      <h1>Play Queue</h1>
    </div>
    <div id="queue-items">
      <table>
        <tr v-for="(item, index) in playback.queue" :class="{ 'is-playing': index === playback.queuePos }">
          <td @click="player.changePos(index)"><figure class="image is-40x40"><img v-bind:src="item.cover" load="lazy"></figure></td>
          <td @click="player.changePos(index)"><p class="is-5">{{ item.title }}</p><p class="subtitle is-5">{{ item.artist + ' - ' + (Math.floor(item.duration / 60) + ':' + ('0' + (item.duration % 60)).slice(-2, 3)) }}</p></td>
          <td data-bind="click: $parent.queue.remove"><span class="delete"><svg class="feather delete"><use xlink:href="/img/feather-sprite.svg#x-circle"></use></svg></span></td>
        </tr>
      </table>
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