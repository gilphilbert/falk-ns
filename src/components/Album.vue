<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-xs-12 col-md-5 has-text-centered-desktop">
        <div class="row album-detail">
          <div class="col-md-8 col-md-offset-2 col-xs-4 art">
            <figure class="image"><img :src="this.art"></figure>
          </div>
          <div class="col-md-8 col-md-offset-2 col-xs-8">
            <h1 class="album-title">{{ this.title }}</h1>
            <p class="subtitle is-1"><router-link :to="'/artist/' + encodeURIComponent(this.$route.params.artist)">{{ this.$route.params.artist }}</router-link></p>
            <p class="is-4 detail">{{ this.year }}</p>
            <p class="is-4"><router-link :to="'/genre/' + encodeURIComponent(this.genre)">{{ this.genre }}</router-link></p>
            <p class="is-6 tag is-rounded detail">{{ shortformat }}</p>
          </div>
        </div>
      </div>
      <div class="col-xs-12 col-md-7">
        <div class="col-xs-12 col-md-11">
          <div class="row album-detail">
            <h1 class="hidden--to-tablet">Album Tracks</h1>
            <table class="table songs">
              <tbody>
                <tr v-for="track in this.tracks" v-bind:data-id="track._id">
                  <td class="pointer" data-bind="click: $parents[1].playAlbumSong"><p class="is-5">{{ track.track + '. ' + track.title }}</p><p class="subtitle is-5">{{ track.artist + ' - ' + Math.floor(track.duration / 60) + ':' + ('0' + (track.duration % 60)).slice(-2, 3) }}</p></td>
                  <td class="hidden--to-tablet"><span class="tag">{{ track.shortformat }}</span></td>
                  <td class="is-narrow">
                    <div class="dropdown is-right">
                      <span onclick="this.closest('div').classList.toggle('is-active')"><svg class="feather"><use xlink:href="/img/feather-sprite.svg#more-vertical"></use></svg></span>
                      <div class="dropdown-content">
                        <span class="dropdown-item">Play</span>
                        <span class="dropdown-item">Add to queue</span>
                        <span class="dropdown-item">Clear and play</span>
                        <span class="dropdown-item">Add to playlist</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import Tiles from './Tiles.vue'
export default {
  name: 'Album',
  components: {
    Tiles
  },
  created() {
    this.$database.getAlbum(this.$route.params.artist, this.$route.params.album)
      .then(data => {
        this.art = data.art
        this.genre = data.genre
        this.shortformat = data.shortformat
        this.title = data.title
        this.tracks = data.tracks
        this.year = data.year
      })
  },
  data () {
    return {
      art: '',
      genre: '',
      shortformat: '',
      title: '',
      tracks: [],
      year: ''
    }
  }
}
</script>