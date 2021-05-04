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