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
        this.playlists = data
      })
    
    this.autoplaylists = [{
      id: -1,
      title: 'Most Played',
      url: `/playlist/_mostplayed`,
      art: '/img/placeholder.png',
      subtitle: '',
      surl: ''
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