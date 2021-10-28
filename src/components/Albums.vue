<template>
<div class="container-fluid">
  <h1 class="is-capitalized">Albums</h1>
  <Tiles :tiles="albums" />
</div>
</template>
<script>
import Tiles from './Tiles.vue'
export default {
  name: 'Albums',
  components: {
    Tiles
  },
  created() {
    this.$database.getAlbums()
      .then(data => {
        data = data.map(e => {
          return {
            urlParams: { name: 'Album', params: { 'album': e.name, 'artist': e.artist } },
            surlParams: { name: 'Artist', params: { 'artist': e.artist } },
            title: e.name,
            subtitle: e.artist,
            art: e.art
          }
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