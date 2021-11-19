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
  created() {
    this.$database.getAlbums()
      .then(data => {
        data = data.map(e => {
          return {
            title: e.name,
            subtitle: e.artist,
            art: e.art,
            urlParams: { name: 'Album', params: { 'album': e.name, 'artist': e.artist } },
            surlParams:   { name: 'Artist', params: { 'artist': e.artist } }
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
  computed: {
    fAlbums () {
      const q = "and"
      return this.albums.filter(v => v.title.toLowerCase().includes(q) || v.subtitle.toLowerCase().includes(q))
    }
  }
}
</script>