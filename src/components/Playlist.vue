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
            <h4>{{ this.playtime }}</h4>
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
                  <td class="pointer" @click="playAll(index)"><p class="is-5">{{ track.track + '. ' + track.title }}</p><p class="subtitle is-5">{{ track.artist + ' - ' + Math.floor(track.duration / 60) + ':' + ('0' + (track.duration % 60)).slice(-2, 3) }}</p></td>
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
    console.log(this.$route.params.id)
    this.$database.getPlaylist(this.$route.params.id)
      .then(data => {
        this.art = data.art
        this.title = data.title
        this.tracks = data.tracks
        let pt = new Date(data.playtime * 1000).toISOString().substr(11, 8)
        if (pt.substr(0, 3) === "00:") {
          pt = pt.substr(3)
        }
        if (pt.substr(0, 1) === "0") {
          pt = pt.substr(1)
        }
        this.playtime = pt
      })
  },
  data () {
    return {
      art: '',
      title: '',
      tracks: [],
      playtime: 0
    }
  },
  methods: {
    playAll(index) {
      const tr = this.tracks.map(e => { return { id: e._id, path: e.path, meta: e } } )
      this.$player.replaceAndPlay(tr, index)
    }
  }
}
</script>