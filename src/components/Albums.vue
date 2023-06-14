<template>
<div class="container-fluid">
  <h1 class="is-capitalized">Albums</h1>
  <Tiles :tiles="fAlbums" />
</div>
</template>
<script>
import Tiles from './Tiles.vue'
export default {
  name: 'Albums',
  components: {
    Tiles
  },
  props: [ 'query', 'filter' ],
  created() {
    this.$database.getAlbums()
      .then(data => {
        data = data.map(e => {
          return {
            title: e.name,
            subtitle: e.artist,
            art: e.art,
            urlParams: { name: 'Album', params: { 'album': e.name, 'artist': e.artist } },
            surlParams:   { name: 'Artist', params: { 'artist': e.artist } },
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
    query(query) {
      this.albums.forEach(el => {
        el.filter = query === '' ? false : el.title.toLowerCase().includes(query.toLowerCase()) ? false : true 
      })
    },

    filter(filter) {
      this.doFilter(filter)
    }
  },
  computed: {
    fAlbums () {
      const q = ""
      return this.albums.filter(v => v.title.toLowerCase().includes(q) || v.subtitle.toLowerCase().includes(q))
    }
  }
}
</script>