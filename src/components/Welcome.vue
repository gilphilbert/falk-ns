<template>
<div class="container" style="height: 100vh">
  <div class="row" style="height: 100%; align-items: center;">
    <div class="col-xs-6 col-xs-offset-3 has-text-centered">
      <img src="/img/falk-blue-white.svg"/>
      <h1>Welcome!</h1>
      <p class="subtitle is-3">It looks like you're new around here</p><p class="is-6 has-text-centered">Before you can log in you'll need to set the admin account password<br><br></p>
      <fieldset style="margin: 5px 0; max-width: 300px; margin: 0 auto">
        <input style="background-color: #404040; border-color: #404040" :value="user" class="input" type="text" readonly />
        <p class="small"></p>
      </fieldset>
      <fieldset style="margin: 5px 0; max-width: 300px; margin: 0 auto">
        <input v-model="pass" class="input" type="password" placeholder="Password" />
        <p class="has-text-danger">{{ passwordMessage }}</p>
      </fieldset>
      <fieldset style="margin: 5px 0; max-width: 300px; margin: 0 auto">
        <input v-model="passV" class="input" type="password" placeholder="Verify password" />
        <p class="has-text-danger">{{ passwordVMessage }}</p>
      </fieldset>
      <fieldset style="margin: 5px 0">
        <button class="button is-rounded is-primary" @click="setPassword">Set Password</button>
      </fieldset>
    </div>
  </div>
</div>
</template>
<script>
export default {
  name: 'Welcome',
  props: [ 'isLoggedInParent' ],
  data() {
    return {
      user: 'admin',
      pass: '',
      passV: '',
      passwordMessage: '',
      passwordVMessage: ''
    }
  },
  methods: {
    setPassword () {
      let err = false
      if (this.pass.length < 8) {
        this.passwordMessage = 'Passwords must be at least 8 characters long'
        err = true
      } else {
        this.passwordMessage = ''
      }
      if (this.pass !== this.passV) {
        this.passwordVMessage = 'Passwords do not match'
        err = true
      } else {
        this.passwordVMessage = ''
      }
      if (err) {
        return
      }
      this.passwordMessage = ''
      this.passwordVMessage = ''
      const body = JSON.stringify({ username: this.user, password: this.pass })
      window.fetch('/api/welcome', { method: 'post', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body })
        .then(response => response.json())
        .then((data) => {
          if (data.state) {
            this.$emit('complete')
          } else {
            // no reason we should actually get here, only if someone's trying to hack us...
            console.log('failed... nice try')
          }
        })
      }
  }
}
</script>