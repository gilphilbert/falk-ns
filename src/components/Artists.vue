<template>
<div class="container-fluid">
  <h1 class="is-capitalized">Artists</h1>
  <Tiles :tiles="artists" />
</div>
</template>
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
        console.log(data)
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