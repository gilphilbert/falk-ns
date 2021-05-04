<template>
<div class="container-fluid">
  <h1>Settings</h1>
  <p class="is-1">Music Library</p>
  <div class="box row has-text-centered">
    <div class="col-xs-4"><h1>{{ this.stats.songs }}</h1><p class="subtitle is-3">Songs</p></div>
    <div class="col-xs-4"><h1>{{ this.stats.artists }}</h1><p class="subtitle is-3">Artists</p></div>
    <div class="col-xs-4"><h1>{{ this.stats.albums }}</h1><p class="subtitle is-3">Albums</p></div>
  </div>
  <table class="table">
    <thead>
      <tr><th>Library Locations</th><th></th></tr>
    </thead>
    <tbody>
      <tr v-for="location in locations" v-bind:key="location">
        <td><p class="is-6">{{ location }}</p></td>
        <td class="is-narrow pointer" @click="removeLocation(location)"><span class="delete"><svg class="feather delete"><use xlink:href="/img/feather-sprite.svg#x-circle"></use></svg></span></td>
      </tr>
    </tbody>
  </table>
  <div style="display: flex; align-items: center;">
    <button class="button no-v is-rounded is-primary" @click="directories.show = true">Add Location</button>
    <button class="button no-v is-primary is-rounded" @click="updateLibrary()">Update Library</button>
  </div>
  <div data-bind="if: settings.isAdmin">
    <br/>
    <p class="is-1">Users</p>
    <table class="table">
      <thead>
        <tr><th colspan="2">Registered users</th></tr>
      </thead>
      <tbody>
        <tr v-for="user in this.users" v-bind:key="user.user">
          <td><p class="is-6">{{ user.user }}</p></td>
          <td class="is-narrow pointer" v-if="user.user !== 'admin'"><span class="delete" @click="removeUser(user.uuid)"><svg class="feather delete"><use xlink:href="/img/feather-sprite.svg#x-circle"></use></svg></span></td>
        </tr>
      </tbody>
    </table>
    <button class="button no-v is-rounded is-primary" @click="newUser.show = true">Add user</button>
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
  <div id="user-modal" class="modal is-small modal-fx-fadeInScale" :class="{ 'is-active': this.newUser.show }">
    <div class="modal-content">
      <div class="box">
        <h1>Add user</h1>
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
          <label class="switch"><input type="checkbox" v-model="newUser.inherit"><span class="slider round"></span></label><span style="margin-left: 5px">Inherit my library</span>
        </fieldset>
        <fieldset style="display: flex; align-items: center;">
          <label class="switch"><input type="checkbox" v-model="newUser.admin"><span class="slider round"></span></label><span style="margin-left: 5px">Admin</span>
        </fieldset>
        <p class="has-text-danger">{{ this.newUser.error }}</p>
        <br/>
        <fieldset>
          <button class="button is-rounded" @click="newUser.show = false">Cancel</button>
          <button class="button is-primary is-rounded" @click="addUser()">Add user</button>
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
    let admin = false
    this.$database.getStats()
      .then(data => {
        this.stats = data
      })
    window.fetch('/api/locations')
      .then(response => response.json())
      .then(data => {
        this.locations = data.locations
        this.isAdmin = data.admin
        if (this.isAdmin) {
          window.fetch('/api/users')
            .then(response => response.json())
            .then(data => {
              this.users = data
            })
        }
      })
    this.getDirectories('')
  },
  data () {
    return {
      stats: {},
      locations: [],
      isAdmin: false,
      users: [],
      newUser: {
        show: false,
        user: '',
        pass: '',
        passVerify: '',
        inherit: false,
        admin: false,
        error: ''
      },
      directories: {
        show: false,
        list: [],
        current: ''
      }
    }
  },
  methods: {
    addLocation () {
      const body = JSON.stringify({ location: this.directories.current })
      window.fetch('/api/locations', { method: 'post', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
        .then(response => response.json())
        .then(data => {
          // returns a list of locations, so let's update that
          this.locations = data
          this.directories.curent = ''
        })
    },
    removeLocation (location) {
      const body = JSON.stringify({ location: location })
      window.fetch('/api/locations', { method: 'delete', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
        .then(response => response.json())
        .then(data => {
          // returns a list of locations, so let's update that
          this.locations = data
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
    addUser() {
      if (this.newUser.user.length > 0 && this.newUser.pass.length > 7 && this.newUser.pass === this.newUser.passVerify) {
        const body = JSON.stringify({ user: this.newUser.user, pass: this.newUser.pass, admin: this.newUser.admin, inherit: this.newUser.inherit })
        this.newUser.error = ''
        window.fetch('/api/users', { method: 'post', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
          .then(response => response.json())
          .then(data => {
            this.users = data
            this.newUser.show = false
            this.newUser.user = ''
            this.newUser.pass = ''
            this.newUser.passVerify = ''
            this.newUser.admin = false
            this.newUser.inherit = false
          })
      } else {
        console.log(this.newUser.pass, this.newUser.pass.length)
        if (this.newUser.pass.length < 8) {
          this.newUser.error = 'Password too short'
        } else if (this.newUser.pass !== this.newUser.passVerify) {
          this.newUser.error = 'Passwords don\'t match'
        } else {
          this.newUser.error = 'You must supply a username'
        }
      }
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