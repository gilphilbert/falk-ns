<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-xs-12 col-md-5 has-text-centered-desktop">
        <div class="row album-detail">
          <div class="col-md-8 col-md-offset-2 col-xs-4 art">
            <figure class="image"><img :src="this.art + '?size=800'"></figure>
          </div>
          <div class="col-md-8 col-md-offset-2 col-xs-8">
            <h1 class="album-title">{{ this.title }}</h1>
            <p class="subtitle is-1"><router-link :to="{ name: 'Artist', params: { artist: this.$route.params.artist } }">{{ this.$route.params.artist }}</router-link></p>
            <p class="is-4 detail">{{ this.year }}</p>
            <p class="is-4"><router-link :to="{ name: 'Genre', params: { genre: this.genre } }">{{ this.genre }}</router-link></p>
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
                <tr v-for="(track, index) in this.tracks" :key="index" v-bind:data-id="track.id">
                  <td class="pointer" @click="playAll(index)"><p class="is-5">{{ track.track + '. ' + track.title }}</p><p class="subtitle is-5">{{ track.artist + ' - ' + Math.floor(track.duration / 60) + ':' + ('0' + (track.duration % 60)).slice(-2, 3) }}</p></td>
                  <td class="hidden--to-tablet"><span class="tag">{{ track.shortformat }}</span></td>
                  <td class="is-narrow">
                    <AlbumDropDown :index="index" :trackID="track.id" @addToPlaylist="addToPlaylist" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <PlaylistModal :show="modalShow" :selectedId="selectedId" @close="modalHide" />
  </div>
</template>
<script>
import Tiles from './Tiles.vue'
import PlaylistModal from './PlaylistModal.vue'
import AlbumDropDown from './AlbumDropDown.vue'

export default {
  name: 'Album',
  components: {
    Tiles,
    PlaylistModal,
    AlbumDropDown
  },
  created() {
    this.$database.getAlbum(this.$route.params.artist, this.$route.params.album)
      .then(data => {
        this.art = data.art
        this.genre = data.genre
        this.shortformat = data.shortformat
        this.title = data.title
        this.tracks = data.tracks.map(e => { e.dropdown = false; return e })
        this.year = data.year
      })
  },
  data () {
    return {
      art: '',
      genre: ' ',
      shortformat: '',
      title: '',
      tracks: [],
      year: '',
      selectedId: -1,
      modalShow: false
    }
  },
  methods: {
    playAll(index) {
      const tr = this.tracks.map(e => e.id)
      this.$player.replaceAndPlay(tr, index)
    },
    addToPlaylist(id) {
      this.selectedId = id
      this.modalShow = true
    },
    modalHide() {
      this.modalShow = false
    }
  }
}
</script>