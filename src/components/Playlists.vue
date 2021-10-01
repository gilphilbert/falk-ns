<template>
<div class="container-fluid">
  <h1 class="is-capitalized">Playlists</h1>
  <Tiles :tiles="autoplaylists" />
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
  created() {
    this.$database.getPlaylists()
      .then(data => {
        data = data.map(e => {
          e.urlParams = { name: 'Playlist', params: { 'id': e.id } }
          e.surlParams = false
          return e
        })
        this.playlists = data
      })
    
    this.autoplaylists = [{
      id: -1,
      title: 'Most Played',
      urlParams: { name: 'Playlist', params: { id: '_mostplayed' } },
      art: '/img/placeholder.png',
      subtitle: '',
      surlParams: false
    }]
  },
  data () {
    return {
      autoplaylists: [],
      playlists: []
    }
  }
}
</script>