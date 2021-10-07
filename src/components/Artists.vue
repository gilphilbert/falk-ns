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
          return {
            urlParams: { name: 'Artist', params: { 'artist': e.name } },
            surlParams: false,
            title: e.name,
            art: e.albums[0].art.artist
          }
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