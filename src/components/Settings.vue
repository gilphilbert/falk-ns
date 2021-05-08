<template>
<div class="container-fluid">
  <h1>Settings</h1>
  <p class="is-1">Library Stats</p>
  <div class="box row has-text-centered">
    <div class="col-xs-4"><h1>{{ this.stats.songs }}</h1><p class="subtitle is-3">Songs</p></div>
    <div class="col-xs-4"><h1>{{ this.stats.artists }}</h1><p class="subtitle is-3">Artists</p></div>
    <div class="col-xs-4"><h1>{{ this.stats.albums }}</h1><p class="subtitle is-3">Albums</p></div>
  </div>
  <br/>
  <div v-if="this.isAdmin">
    <p class="is-2">Users</p>
    <table class="table">
      <thead>
        <tr><th>Name</th><th>Type</th><th colspan="2">Libraries</th></tr>
      </thead>
      <tbody>
        <tr v-for="user in this.users" v-bind:key="user.user" @click="editUser(user.uuid)">
          <td><p class="is-6">{{ user.user }}</p></td>
          <td><p class="is-6">{{ ((user.admin === true) ? 'Admin' : 'User') }}</p></td>
          <td><p class="is-6">{{ this.locations.filter(l => l.users.includes(user.uuid)).length }}</p></td>
          <td class="is-narrow pointer" v-if="user.user !== 'admin'"><span class="delete" @click="removeUser(user.uuid)"><svg class="feather delete"><use xlink:href="/img/feather-sprite.svg#x-circle"></use></svg></span></td>
        </tr>
      </tbody>
    </table>
    <button class="button no-v is-rounded is-primary" @click="addUser()">Add User</button>
    <br/><br/>
    <p class="is-2">Music Libraries</p>
    <table class="table">
      <thead>
        <tr><th colspan="2">Path</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="location in locations" v-bind:key="location.path">
          <td><p class="is-6">{{ location.path }}</p></td>
          <td class="is-narrow pointer" @click="removeLocation(location)"><span class="delete"><svg class="feather delete"><use xlink:href="/img/feather-sprite.svg#x-circle"></use></svg></span></td>
        </tr>
        <tr v-if="locations.length === 0" >
          <td class="is-narrow" style="padding-top: 7px;">No paths set yet, click 'Add Path' below'</td>
        </tr>
      </tbody>
    </table>
    <div style="display: flex; align-items: center; margin-top: 15px">
      <button class="button no-v is-rounded is-primary" @click="directories.show = true">Add Path</button>
      <button class="button no-v is-primary is-rounded" @click="updateLibrary()">Update Library</button>
    </div>
  </div>

  <div id="dir-modal" class="modal is-small modal-fx-fadeInScale" :class="{ 'is-active': this.directories.show }">
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
  <div id="user-modal" class="modal is-md modal-fx-fadeInScale" :class="{ 'is-active': this.newUser.show }">
    <div class="modal-content">
      <div class="box">
        <h1>{{ ((this.newUser.uuid === false) ? 'Add user' : 'Edit user') }}</h1>
        <fieldset>
          <input class="input" type="text" placeholder="Username" v-model="newUser.user" />
        </fieldset>
        <fieldset>
          <input class="input" type="password" placeholder="Password" v-model="newUser.pass" />
        </fieldset>
        <fieldset>
          <input class="input" type="password" placeholder="Verify password" v-model="newUser.passVerify" />
        </fieldset>
        <fieldset style="display: flex; align-items: center;">
          <label class="switch"><input type="checkbox" v-model="newUser.admin"><span class="slider round"></span></label><span style="margin-left: 5px">Admin</span>
        </fieldset>
        <br/>
        <p class="is-3">Libraries</p>
        <fieldset v-for="loc in this.newUser.locations" v-bind:key="loc.path" style="display: flex; align-items: center;">
          <label class="switch"><input type="checkbox" v-model="loc.enabled"><span class="slider round"></span></label><span style="margin-left: 5px">{{ loc.path }}</span>
        </fieldset>
        <p class="has-text-danger">{{ this.newUser.error }}</p>
        <br/>
        <fieldset>
          <button class="button is-rounded" @click="newUser.show = false">Cancel</button>
          <button class="button is-primary is-rounded" @click="sendUser()">Add user</button>
        </fieldset>
      </div>
    </div>
  </div>
</div>
</template>
<script>
export default {
  name: 'Settings',
  created() {
    window.fetch('/api/users')
      .then(response => {
        if (response.status === 200) {
          this.isAdmin = true
        }
        return response.json()
      })
      .then(data => {
        this.users = data
        window.fetch('/api/locations')
          .then(response => response.json())
          .then(data => {
            this.setLocations(data)
            this.getDirectories('')
        })
      })
      .catch(() => {})
  },
  data () {
    return {
      locations: [],
      isAdmin: false,
      users: [],
      newUser: {
        uuid: false,
        show: false,
        user: '',
        pass: '',
        passVerify: '',
        admin: false,
        error: '',
        locations: []
      },
      directories: {
        show: false,
        list: [],
        current: ''
      }
    }
  },
  props: [ 'stats' ],
  methods: {
    setLocations (locs) {
      this.locations = locs
      this.newUser.locations = locs.map(e => { return { path: e.path, enabled: false } })
    },
    addLocation () {
      const body = JSON.stringify({ location: this.directories.current, users: [] })
      window.fetch('/api/locations', { method: 'put', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
        .then(response => response.json())
        .then(data => {
          this.directories.curent = ''
          this.setLocations(data)
        })
    },
    removeLocation (location) {
      const body = JSON.stringify({ location: location.path })
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
    sendUser() {
      if (this.newUser.uuid === false) {
        if (this.newUser.user.length > 0 && this.newUser.pass.length > 7 && this.newUser.pass === this.newUser.passVerify) {
          const ad = ((this.newUser.admin === true) ? this.newUser.admin : false)
          const body = JSON.stringify({ user: this.newUser.user, pass: this.newUser.pass, admin: ad, locations: this.newUser.locations })
          this.newUser.error = ''
          window.fetch('/api/users', { method: 'put', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
            .then(response => response.json())
            .then(data => {
              if (data.message) {
                console.log(data)
              } else {
                this.users = data.users
                this.setLocations(data.locations)
                this.newUser.show = false
              }
            })
            .catch(e => {
              console.log(e)
            })
        } else {
          if (this.newUser.pass.length < 8) {
            this.newUser.error = 'Password too short'
          } else if (this.newUser.pass !== this.newUser.passVerify) {
            this.newUser.error = 'Passwords don\'t match'
          } else {
            this.newUser.error = 'You must supply a username'
          }
        }
      } else {
        // editing a user
        if (this.newUser.user.length > 0 && this.newUser.pass === this.newUser.passVerify) {
          const ad = ((this.newUser.admin === true) ? this.newUser.admin : false)
          const body = JSON.stringify({ id: this.newUser.uuid, user: this.newUser.user, pass: this.newUser.pass, admin: ad, locations: this.newUser.locations })
          this.newUser.error = ''
          window.fetch('/api/users', { method: 'post', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
            .then(response => response.json())
            .then(data => {
              if (data.message) {
                console.log(data)
              } else {
                console.log(data)
                this.users = data.users
                this.setLocations(data.locations)
                this.newUser.show = false
              }
            })
            .catch(e => {
              console.log(e)
            })
        } else {
          if (this.newUser.pass.length < 8) {
            this.newUser.error = 'Password too short'
          } else if (this.newUser.pass !== this.newUser.passVerify) {
            this.newUser.error = 'Passwords don\'t match'
          } else {
            this.newUser.error = 'You must supply a username'
          }
        }
      }
    },
    addUser () {
      this.newUser.show = true
      this.newUser.user = ''
      this.newUser.pass = ''
      this.newUser.passVerify = ''
      this.newUser.admin = false
      this.newUser.locations.forEach(l => { l.enabled = false })
      this.newUser.uuid = false
    },
    editUser (uuid) {
      const user = this.users.filter(u => u.uuid === uuid)[0]
      this.newUser.show = true
      this.newUser.user = user.user
      this.newUser.pass = ''
      this.newUser.passVerify = ''
      this.newUser.admin = user.admin
      this.newUser.locations.forEach(l => { l.enabled = this.locations.filter(m => m.path === l.path)[0].users.includes(uuid) })
      this.newUser.uuid = user.uuid
    },
    removeUser (uuid) {
      const body = JSON.stringify({ uuid: uuid })
      window.fetch('/api/users', { method: 'delete', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
        .then(response => response.json())
        .then(data => {
          // update variables
          this.users = data
        })
    }
  }
}
</script>

<style lang="css">
  .modal.is-md .modal-content, .modal.is-md .modal-card {
    width: 600px;
  }
</style>