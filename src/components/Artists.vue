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
    fetch('/api/artists')
      .then(data => data.json())
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