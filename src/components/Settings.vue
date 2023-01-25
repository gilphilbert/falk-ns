<template>
<div class="container-fluid">
  <h1>Settings</h1>
  <p class="is-1">Library Stats</p>
  <div class="box darken row has-text-centered">
    <div class="col-xs-4"><h1>{{ this.stats.songs }}</h1><p class="subtitle is-3">Songs</p></div>
    <div class="col-xs-4"><h1>{{ this.stats.artists }}</h1><p class="subtitle is-3">Artists</p></div>
    <div class="col-xs-4"><h1>{{ this.stats.albums }}</h1><p class="subtitle is-3">Albums</p></div>
  </div>
  <br/>
  <div>
    <p class="is-2">Music Libraries</p>
    <table class="is-half">
      <tbody>
        <tr v-for="location in locations" v-bind:key="location">
          <td><p class="is-6">{{ location }}</p></td>
          <td class="is-narrow pointer" @click="removeLocation(location)"><span class="delete"><svg class="feather delete"><use xlink:href="/img/feather-sprite.svg#x-circle"></use></svg></span></td>
        </tr>
        <tr v-if="locations.length === 0" >
          <td class="is-narrow" style="padding-top: 7px;">No paths set yet, click 'Add Path' below'</td>
        </tr>
      </tbody>
    </table>
    <div style="display: flex; align-items: center; margin-top: 15px">
      <button class="button no-v is-primary is-rounded" @click="directories.show = true">Add Path</button>
      <button class="button no-v is-primary is-rounded" @click="updateLibrary()">Update Library</button>
      <button class="button no-v is-primary is-rounded" @click="rescanLibrary()">Rescan Library</button>
    </div>
  </div>

  <div id="dir-modal" class="modal is-sm modal-fx-fadeInScale" :class="{ 'is-active': this.directories.show }">
    <div class="modal-content">
      <div class="box">
        <h1>Add directory</h1>
        <div>
          <input class="input" type="text" readonly :value="this.directories.current" />
          <p></p>
        </div>
        <div style="padding: 2px 0; max-height: 70vh; overflow-y: auto">
          <table>
            <tr class="pointer" v-for="dir in this.directories.list" @click="getDirectories(dir.name)" :key="dir.name"><td class="is-narrow"><svg class="feather"><use href="/img/feather-sprite.svg#folder"></use></svg>&nbsp;</td><td>{{ dir.name }}</td></tr>
          </table>
        </div>
        <p></p>
        <button class="button is-rounded" @click="directories.show = false">Cancel</button>
        <button class="button is-primary is-rounded" @click="directories.show = false; addLocation()">Add directory</button>
      </div>
    </div>
  </div>
</div>
</template>
<script>
export default {
  name: 'Settings',
  created() {
    window.fetch('/api/locations')
      .then(response => response.json())
      .then(data => {
        this.setLocations(data)
        this.getDirectories('')
    })

    this.enqueueOnClick = this.$settings.get('enqueueOnClick', true)
  },
  data () {
    return {
      locations: [],
      directories: {
        show: false,
        list: [],
        current: ''
      },
      enqueueOnClick: true
    }
  },
  props: [ 'stats' ],
  methods: {
    setLocations (locs) {
      this.locations = locs
    },
    addLocation () {
      const body = JSON.stringify({ location: this.directories.current })
      window.fetch('/api/locations', { method: 'put', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
        .then(response => response.json())
        .then(data => {
          this.directories.curent = ''
          this.setLocations(data)
        })
    },
    removeLocation (location) {
      const body = JSON.stringify({ location: location })
      window.fetch('/api/locations', { method: 'delete', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
        .then(response => response.json())
        .then(data => {
          // returns a list of locations, so let's update that
          this.setLocations(data)
        })
    },
    getDirectories (base) {
      let next
      const curLocation = this.directories.current
      // case for when nothing is provided (initial load)
      if (base === '') {
        next = ''
      // case for when someone clicks the "up" button (..)
      } else if (base === '..') {
        next = curLocation.substr(0, curLocation.lastIndexOf('/'))
        if (next === '') {
          next = '/'
        }
      // anything else (they clicked a directory)
      } else {
        if (curLocation === '/') {
          next = '/' + base
        } else {
          next = curLocation + '/' + base
        }
      }
      // create body
      const body = JSON.stringify({ location: next })
      // make request
      window.fetch('/api/directories', { method: 'post', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
        .then(response => response.json())
        .then(data => {
          // update variables
          this.directories.current = data.location
          this.directories.list = data.directories
        })
    },
    updateLibrary () {
      window.fetch('/api/update')
        .catch(err => {
          console.log(err)
        })
    },
    rescanLibrary () {
      window.fetch('/api/rescan')
        .catch(err => {
          console.log(err)
        })
    }
  }
}
</script>

<style lang="css">

</style>