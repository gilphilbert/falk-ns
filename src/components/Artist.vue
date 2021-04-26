<template>
<div class="container-fluid">
  <div class="row center">
    <div class="col-md-1 hidden--to-tablet">
      <figure class="image is-rounded has-no-overflow">
        <img v-bind:src="((this.albums.length) ? this.albums[0].artistart : '')" />
      </figure>
    </div>
    <div class="col-xs-12 col-md-6">
      <h1>{{ this.$route.params.artist }}</h1>
    </div>
  </div>
  <Tiles :tiles="albums" />
</div>
</template>
<script>
import Tiles from './Tiles.vue'

export default {
  name: 'Artist',
  components: {
    Tiles
  },
  created() {
    this.$database.getArtist(this.$route.params.artist)
      .then(data => {
        this.albums = data.albums
      })
  },
  data () {
    return {
      albums: []
    }
  }
}
</script>