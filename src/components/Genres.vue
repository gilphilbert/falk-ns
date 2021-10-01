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
        data = data.map(e => {
          e.urlParams = { name: 'Genre', params: { 'genre': e.title } }
          e.surlParams = false
          return e
        })
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