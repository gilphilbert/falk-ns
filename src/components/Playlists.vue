<template>
<div class="container-fluid">
  <h1 class="is-capitalized">Playlists</h1>
  <Tiles :tiles="playlists" />
</div>
</template>
<script>
import Tiles from './Tiles.vue'
export default {
  name: 'Playlists',
  components: {
    Tiles
  },
  props: [ 'query' ],
  created() {
    this.$database.getPlaylists()
      .then(data => {
        data = data.map(e => {
          return {
            title: e.name,
            subtitle: null,
            art: e.coverart || '/img/placeholder.png',
            urlParams: { name: 'Playlist', params: { 'id': e.id } },
            surlParams: false,
            filter: false
          }
        })
        this.playlists = data
      })
  },
  data () {
    return {
      playlists: []
    }
  },
  watch: {
    query(query) {
      this.playlists.forEach(el => {
        el.filter = query === '' ? false : el.title.toLowerCase().includes(query.toLowerCase()) ? false : true 
      })
    }
  }
}
</script>