<template>
  <div id="app">
    <Login v-if="loginScreen" :isLoggedIn="isLoggedIn" />
    <Welcome v-if="welcomeScreen" @complete="welcomeComplete" />
    <Main v-if="showApp" :isLoggedIn="isLoggedIn" @loggedOut="loggedOut" />
  </div>
</template>
<script>
import Login from './components/Login.vue'
import Welcome from './components/Welcome.vue'
import Main from './components/Main.vue'
export default {
  name: 'App',
  components: {
    Login,
    Welcome,
    Main
  },
  created () {
    window.fetch('/api/check')
      .then(r => {
        if (r.status === 200) {
          this.loginScreen = false
          this.welcomeScreen = false
          this.showApp = true
        } else if (r.status === 400) {
          this.loginScreen = false
          this.welcomeScreen = true
          this.showApp = false
        } else {
          this.loginScreen = true
          this.welcomeScreen = false
          this.showApp = false
        }
      })
      .catch(e => {
        // we're not connected to the internet (fetch failed)
        const lis = window.localStorage.getItem('loggedIn')
        console.log(lis)
        if (lis && lis === 'true') {
          this.loginScreen = false
          this.welcomeScreen = false
          this.showApp = true
        } else {
          console.log('offline and not logged in')
        }
      })
  },
  data () {
    return {
      loginScreen: false,
      welcomeScreen: false,
      showApp: false
    }
  },
  methods: {
    isLoggedIn(state) {
      this.loginScreen = !state
      this.showApp = state
      if (state) {
        this.$database.update()
      }
    },
    welcomeComplete () {
      this.welcomeScreen = false
      this.loginScreen = true
    },
    loggedOut () {
      this.isLoggedIn(false)
    }
  }
}
</script>