<template>
  <div id="app">
    <Login v-if="loginScreen" :isLoggedIn="isLoggedIn" />
    <Main v-if="showApp" :isLoggedIn="isLoggedIn" />
  </div>
</template>
<script>
import Login from './components/Login.vue'
import Main from './components/Main.vue'
export default {
  name: 'App',
  components: {
    Login,
    Main
  },
  created () {
    window.fetch('/api/check')
      .then(r => {
        let loggedIn = false
        if (r.status === 200) {
          loggedIn = true
        }
        this.loginScreen = !loggedIn
        this.showApp = loggedIn
      })
  },
  data () {
    return {
      loginScreen: false,
      showApp: false
    }
  },
  methods: {
    isLoggedIn(state) {
      this.loginScreen = !state
      this.showApp = state
      this.$database.update()
    }
  }
}
</script>