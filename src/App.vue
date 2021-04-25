<template>
  <div id="app">
    <Login v-if="loginScreen" :isLoggedInParent="isLoggedIn" />
    <Main v-if="!loginScreen" :isLoggedInParent="isLoggedIn" />
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
  data() {
    return {
      loginScreen: false,
    }
  },
  methods: {
    isLoggedIn(state = true) {
      this.loginScreen = !state
    }
  }
}
</script>