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
    //this.$database.getAlbums()
    fetch(`/api/albums`)
      .then(data => data.json())
      .then(data => {
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