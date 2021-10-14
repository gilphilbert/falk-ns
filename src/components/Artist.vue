<template>
<div>
  <figure class="image hidden--for-desktop">
    <img :src="((this.albums.length) ? this.albums[0].background : '')" style="object-fit: cover;height: 30vh;object-position: center;width: 100%">
  </figure>
  <div class="container-fluid">
    <div class="row center">
      <div class="col-md-1 hidden--to-tablet">
        <figure class="image is-rounded has-no-overflow">
          <img v-bind:src="((this.albums.length && this.albums[0].artistart) ? this.albums[0].artistart : '/img/placeholder.png')" />
        </figure>
      </div>
      <div class="col-xs-12 col-md-6">
        <h1>{{ this.$route.params.artist }}</h1>
      </div>
    </div>
    <Tiles :tiles="albums" />
  </div>
</div>
</template>
<script>
import Tiles from './Tiles.vue'

export default {
  name: 'Artist',
  components: {
    Tiles
  },
  created() {
    this.$database.getArtist(this.$route.params.artist)
      .then(data => {
        data.albums = data.albums.map(e => {
          return {
            title: e.name,
            urlParams: { name: 'Album', params: { 'album': e.name, 'artist': data.name } },
            subtitle: e.year,
            surlParams: false,
            art: e.art.cover,
            background: e.art.background,
            artistart: e.art.artist
          }
        })
      this.albums = data.albums
      })
  },
  data () {
    return {
      albums: [],
      background: ''
    }
  }
}
</script>