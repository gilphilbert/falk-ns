<template>
  <div class="container-fluid">
    <h1 class="is-capitalized">Search</h1>
    <div class="box" style="padding: 8px 20px 20px 20px" v-if="artists.length > 0">
      <h2 style="margin-bottom: 0">Artists</h2>
      <Tiles :tiles="artists" />
      <button class="button no-v is-primary is-rounded">View All ></button>
    </div>
    <div class="box" style="padding: 8px 20px 20px 20px" v-if="albums.length > 0">
      <h2 style="margin-bottom: 0">Albums</h2>
      <Tiles :tiles="albums" />
      <button class="button no-v is-primary is-rounded">View All ></button>
    </div>
    <div class="box" style="padding: 8px 20px 20px 20px" v-if="tracks.length > 0">
      <h2 style="margin-bottom: 5px">Tracks</h2>
      <table class="table songs">
        <tbody>
          <tr v-for="(track, index) in this.tracks" :key="index" v-bind:data-id="track.id">
            <td class="pointer" @click="$player.replaceAndPlay([track.id])"><p class="is-5 is-capitalized">{{ track.title }}</p><p class="subtitle is-5">{{ track.album + ' - ' + track.artist /*+ ' - ' + Math.floor(track.duration / 60) + ':' + ('0' + (track.duration % 60)).slice(-2, 3)*/ }}</p></td>
            <td class="hidden--to-tablet"><span class="tag">{{ track.shortestformat }}</span></td>
            <td class="is-narrow">
              <AlbumDropDown :index="index" :trackID="track.id" @addToPlaylist="addToPlaylist" @playFromHere="playFromHere" />
            </td>
          </tr>
        </tbody>
      </table>
      <button class="button no-v is-primary is-rounded">View All ></button>
    </div>
    <PlaylistModal :show="modalShow" :selectedId="selectedId" @close="modalHide" />
  </div>
</template>
<script>
import Tiles from './Tiles.vue'
import AlbumDropDown from './AlbumDropDown.vue'
import PlaylistModal from './PlaylistModal.vue'

export default {
  name: 'Search',
  components: {
    Tiles,
    AlbumDropDown,
    PlaylistModal
  },
  created() {
    this.doSearch(this.$route.params.query)

    this.$watch(
      () => this.$route.params.query,
      (toParams) => {
        this.doSearch(toParams)
      }
    )
  },
  data () {
    return {
      artists: [],
      albums: [],
      tracks: [],
      modalShow: false,
      selectedId: -1,
    }
  },
  methods: {
    playFromHere(index) {
      const tr = this.tracks.map(e => e.id)
      this.$player.replaceAndPlay(tr, index)
    },
    addToPlaylist(id) {
      this.selectedId = id
      this.modalShow = true
    },
    modalHide() {
      this.modalShow = false
    },
    setDropdown(track) {
      return function () {
        track.dropdown = true
      }
    },
    doSearch(query) {
      this.$database.quickSearch(query)
      .then(data => {

        this.artists = data.artists.map(e => {
          return {
            title: e.name,
            art: e.art,
            subtitle: null,
            urlParams: { name: 'Artist', params: { 'artist': e.name } },
            surlParams: false,
            filter: false
          }
        })
        this.albums = data.albums.map(e => {
          return {
            title: e.name,
            subtitle: e.artist,
            art: e.art,
            urlParams: { name: 'Album', params: { 'album': e.name, 'artist': e.artist } },
            surlParams:   { name: 'Artist', params: { 'artist': e.artist } },
            filter: false
          }
        })
        this.tracks = data.tracks.map(e => { e.dropdown = false; return e })
      })
    }
  }
}
</script>

<style>
  table.songs:has(.dropdown.is-active) tr td.pointer {
    pointer-events: none;
  }

  .box {
    background-color: var(--darken)
  }
</style>