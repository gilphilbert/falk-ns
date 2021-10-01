<template>
<div class="container-fluid">
  <h1 class="is-capitalized">{{ this.$route.params.genre }}</h1>
  <Tiles :tiles="albums" />
</div>
</template>
<script>
import Tiles from './Tiles.vue'
export default {
  name: 'Genre',
  components: {
    Tiles
  },
  created() {
    this.$database.getGenre(this.$route.params.genre)
      .then(data => {
        data = data.map(e => {
          e.urlParams = { name: 'Album', params: { album: e.title, artist: e.subtitle } }
          e.surlParams = { name: 'Artist', params: { artist: e.subtitle } }
          return e
        })
        this.albums = data
      })
  },
  data () {
    return {
      albums: []
    }
  }
}
</script>