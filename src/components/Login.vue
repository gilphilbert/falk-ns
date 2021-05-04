<template>
  <div class="container" style="height: 100vh">
    <div class="row" style="height: 100%; align-items: center;">
      <div class="col-xs-6 col-xs-offset-3 has-text-centered">
        <img src="/img/falk-blue-white.svg"/>
        <h1>Soundbyte</h1>
        <p class="subtitle is-4">Please login to access your music!</p>
        <br/>
        <fieldset style="margin: 5px 0; max-width: 300px; margin: 0 auto">
          <input v-model="user" class="input" type="text" placeholder="Username" />
        </fieldset>
        <br/>
        <fieldset style="margin: 5px 0; max-width: 300px; margin: 0 auto">
          <input v-model="pass" class="input" type="password" placeholder="Password" @keydown.enter="login" />
        </fieldset>
        <span class="message-danger" v-if="error !== ''">{{ error }}</span>
        <br/>
        <button @click="login" class="button is-rounded is-primary">Log In</button>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Login',
  props: [ 'isLoggedIn' ],
  data() {
    return {
      user: '',
      pass: '',
      error: '',
    }
  },
  methods: {
    login() {
      const body = JSON.stringify({ username: this.user, password: this.pass })
      window.fetch('/api/login', { method: 'post', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
        .then(response => response.json())
        .then(data => {
          if (data.state === 'failed' || data.state === false) {
            // show a message that login failed
            this.error = 'Invalid username and/or password'
          } else {
            this.isLoggedIn(true)
          }
        })
        .catch(err => {
          console.log(err)
        })
    }
  }
}
</script>
<style scoped></style>