<template>
<div class="container-fluid">
  <h1 class="is-capitalized">Genres</h1>
  <Tiles :tiles="genres" />
</div>
</template>
<script>
import Tiles from './Tiles.vue'
export default {
  name: 'Genres',
  components: {
    Tiles
  },
  created() {
    this.$database.getGenres()
      .then(data => {
        this.genres = data
      })
  },
  data () {
    return {
      genres: []
    }
  }
}
</script>