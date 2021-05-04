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