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
            <p class="subtitle is-1">{{ this.tracks.length }} track{{ this.tracks.length === 1 ? '' : 's' }}</p>
            <h4>{{ this.totalDuration }}</h4>
          </div>
        </div>
      </div>
      <div class="col-xs-12 col-md-7">
        <div class="col-xs-12 col-md-11">
          <div class="row album-detail">
            <h1 class="hidden--to-tablet">Playlist Tracks</h1>
            <table class="table songs">
              <tbody>
                <tr v-for="(track, index) in this.tracks" :key="index" v-bind:data-id="track._id">
                  <td class="pointer" @click="playAll(index)">
                    <p class="is-5" v-if="'count' in track">{{ track.title }} ({{ track.count }})</p>
                    <p class="is-5" v-else>{{ track.title }}</p>
                    <p class="subtitle is-5">{{ track.artist + ' - ' + Math.floor(track.duration / 60) + ':' + ('0' + (track.duration % 60)).slice(-2, 3) }}</p>
                  </td>
                  <td class="hidden--to-tablet"><span class="tag">{{ track.shortformat }}</span></td>
                  <td class="is-narrow">
                    <PlaylistDropDown :index="index" :trackID="track.id" @removeTrack="removeTrack" />
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
import PlaylistDropDown from './PlaylistDropDown.vue'
export default {
  name: 'Playlist',
  components: {
    PlaylistDropDown
  },
  created() {
    this.refreshPlaylist()
  },
  data () {
    return {
      art: '',
      title: '',
      tracks: [],
      playtime: 0,
      plID: -1
    }
  },
  methods: {
    playAll(index) {
      const tr = this.tracks.map(e => e.id)
      this.$player.replaceAndPlay(tr, index)
    },
    refreshPlaylist() {
      let id = this.$route.params.id
      this.plID = id
      if (id.substr(0, 1) === '_') {
        id = 'auto/' + id.substr(1)
      }

      this.$database.getPlaylist(id)
        .then(data => {
        console.log(data)
          this.art = data.coverart || '/img/placeholder.png'
          this.title = data.name
          this.tracks = data.tracks.map(e => { e.dropdown = false; return e })
        })
    },
    removeTrack (id) {
      this.$database.removeFromPlaylist(this.plID, id)
        .then((data) => {
          this.tracks = data.tracks.map(e => { e.dropdown = false; return e })
        })
        .catch()
    }
  },
  computed: {
    totalDuration: function () {
      const ds = Object.values(this.tracks).reduce((t, {duration}) => t + duration, 0)
      let pt = new Date(ds * 1000).toISOString().substr(11, 8)
      if (pt.substr(0, 3) === "00:") {
        pt = pt.substr(3)
      }
      if (pt.substr(0, 1) === "0") {
        pt = pt.substr(1)
      }
      return pt
    }
  }
}
</script>