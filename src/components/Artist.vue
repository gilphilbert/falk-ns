<template>
<div>
  <figure class="image hidden--for-desktop">
    <img :src="((this.albums.length) ? this.background : '')" style="object-fit: cover;height: 30vh;object-position: center;width: 100%">
  </figure>
  <div class="container-fluid">
    <div class="row center">
      <div class="col-md-1 hidden--to-tablet">
        <figure class="image is-rounded has-no-overflow">
          <img v-bind:src="((this.art) ? this.art : '/img/placeholder.png')" />
        </figure>
      </div>
      <div class="col-xs-12 col-md-6">
        <h1 class="is-capitalized">{{ this.artist }}</h1>
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
  props: ['artist'],
  created() {
    this.$database.getArtist(this.$route.params.artist)
      .then(data => {
        this.background = data.background
        this.art = data.artistart
        data.albums = data.albums.map(e => {
          return {
            title: e.name,
            subtitle: e.year,
            art: e.art,
            urlParams: { name: 'ArtistAlbum', params: { 'album': e.name, 'artist': this.artist } },
            surlParams: false,
          }
        })
        this.albums = data.albums
      })
  },
  data () {
    return {
      albums: [],
      background: '',
      art: '',
    }
  }
}
</script>