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
  props: [ 'filter' ],
  created() {
    this.$database.getGenre(this.$route.params.genre)
      .then(data => {
        data = data.map(e => {
          return {
            title: e.name,
            subtitle: e.artist,
            art: e.art,
            urlParams: { name: 'Album', params: { album: e.name, artist: e.artist } },
            surlParams: { name: 'Artist', params: { artist: e.artist } },
            lossless: e.lossless,
            maxbits: e.maxbits,
            filter: false
          }
        })
        this.albums = data
        this.doFilter(this.filter)
      })
  },
  data () {
    return {
      albums: []
    }
  },
  methods: {
    doFilter: function (filter) {
      this.albums.forEach(el => {
        if (filter === 0) el.filter = false
        if (filter === 1) el.filter = !el.lossless
        if (filter === 2) el.filter = el.maxbits <= 16
      })
    }
  },
  watch: {
    //query(query) {
    //  this.albums.forEach(el => {
    //    el.filter = query === '' ? false : el.title.toLowerCase().includes(query.toLowerCase()) ? false : true 
    //  })
    //},
    filter(filter) {
      this.doFilter(filter)
    }
  },

}
</script>