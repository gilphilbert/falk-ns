<template>
  <div id="app">
    <Login v-if="loginScreen" :isLoggedIn="isLoggedIn" />
    <Welcome v-if="welcomeScreen" @complete="welcomeComplete" />
    <Main v-if="showApp" :isLoggedIn="isLoggedIn" />
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
          console.log('App')
          this.loginScreen = false
          this.welcomeScreen = false
          this.showApp = true
        } else if (r.status === 400) {
          console.log('Welcome')
          this.loginScreen = false
          this.welcomeScreen = true
          this.showApp = false
        } else {
          console.log('Login')
          this.loginScreen = true
          this.welcomeScreen = false
          this.showApp = false
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
      this.$database.update()
    },
    welcomeComplete () {
      this.welcomeScreen = false
      this.loginScreen = true
    }
  }
}
</script>