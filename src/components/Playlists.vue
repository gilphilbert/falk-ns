<template>
<div class="container-fluid">
  <h1 class="is-capitalized">Playlists</h1>
  <Tiles :tiles="playlists" />
</div>
</template>
<script>
import Tiles from './Tiles.vue'
export default {
  name: 'Playlists',
  components: {
    Tiles
  },
  created() {
    this.$database.getPlaylists()
      .then(data => {
        this.playlists = data
        console.log(data)
      })
  },
  data () {
    return {
      playlists: []
    }
  }
}
</script>