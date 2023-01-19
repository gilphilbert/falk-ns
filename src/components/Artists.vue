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
  props: [ 'query' ],
  created() {
    this.$database.getArtists()
      .then(data => {
        data = data.map(e => {
          return {
            title: e.name,
            art: e.art,
            subtitle: null,
            urlParams: { name: 'Artist', params: { 'artist': e.name } },
            surlParams: false,
            filter: false
          }
        })
        this.artists = data
      })
  },
  data () {
    return {
      artists: []
    }
  },
  watch: {
    query(query) {
      this.artists.forEach(el => {
        el.filter = query === '' ? false : el.title.toLowerCase().includes(query.toLowerCase()) ? false : true 
      })
    }
  }
}
</script>