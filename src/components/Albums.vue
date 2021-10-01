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
        console.log(data)
        data = data.map(e => {
          e.urlParams = { name: 'Album', params: { 'album': e.title, 'artist': e.subtitle } }
          e.surlParams = { name: 'Artist', params: { 'artist': e.subtitle } }
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