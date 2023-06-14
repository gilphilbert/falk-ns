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
  props: [ 'query', 'filter' ],
  mounted() {
    this.$database.getArtists()
      .then(data => {
        data = data.map(e => {
          return {
            title: e.name,
            art: e.art,
            subtitle: null,
            urlParams: { name: 'Artist', params: { 'artist': e.name } },
            surlParams: false,
            lossless: e.lossless,
            maxbits: e.maxbits,
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
    },

    filter(filter) {
      this.artists.forEach(el => {
        if (filter === 0) el.filter = false
        if (filter === 1) el.filter = !el.lossless
        if (filter === 2) el.filter = el.maxbits <= 16
      })
    }
  }
}
</script>