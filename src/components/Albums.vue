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
  props: [ 'query' ],
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
            filter: false
          }
        })
        this.albums = data
      })
  },
  data () {
    return {
      albums: []
    }
  },
  watch: {
    query(query) {
      this.albums.forEach(el => {
        el.filter = query === '' ? false : el.title.toLowerCase().includes(query.toLowerCase()) ? false : true 
      })
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