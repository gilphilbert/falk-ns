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
  props: [ 'query', 'filter' ],
  created() {
    this.$database.getGenres()
      .then(data => {
        data = data.map(e => {
          return {
            title: e.name,
            subtitle: null,
            art: e.art,
            urlParams: { name: 'Genre', params: { 'genre': e.name } },
            surlParams: false,
            lossless: e.lossless,
            maxbits: e.maxbits,
            filter: false
          }
        })
        this.genres = data
        this.doFilter(this.filter)
      })
  },
  data () {
    return {
      genres: []
    }
  },
  methods: {
    doFilter: function (filter) {
      this.genres.forEach(el => {
        if (filter === 0) el.filter = false
        if (filter === 1) el.filter = !el.lossless
        if (filter === 2) el.filter = el.maxbits <= 16
      })
    }
  },
  watch: {
    query(query) {
      this.genres.forEach(el => {
        el.filter = query === '' ? false : el.title.toLowerCase().includes(query.toLowerCase()) ? false : true 
      })
    },

    filter(filter) {
      this.doFilter(filter)
    }
  }
}
</script>