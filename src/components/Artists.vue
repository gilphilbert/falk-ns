<template>
<div class="container-fluid">
  <h1 class="is-capitalized">Artists</h1>
  <Tiles :tiles="artists" />
</div>
</template>
<script>
import Tiles from './Tiles.vue'
export default {
  name: 'Artists',
  components: {
    Tiles
  },
  created() {
    this.$database.getArtists()
      .then(data => {
        data = data.map(e => {
          e.urlParams = { name: 'Artist', params: { 'artist': e.title } }
          e.surlParams = false
          return e
        })
        this.artists = data
      })
  },
  data () {
    return {
      artists: []
    }
  }
}
</script>