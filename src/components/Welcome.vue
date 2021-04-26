<template>
<div class="container" style="height: 100vh">
  <div class="row" style="height: 100%; align-items: center;">
    <div class="col-xs-6 col-xs-offset-3 has-text-centered">
      <img src="/img/falk-blue-white.svg"/>
      <h1>Welcome!</h1>
      <p class="subtitle is-3">It looks like you're new around here</p><p class="is-6 has-text-centered">Before you can log in you'll need to set the admin account password<br><br></p>
      <fieldset style="margin: 5px 0; max-width: 300px; margin: 0 auto">
        <input style="background-color: #404040; border-color: #404040" data-bind="value: username" class="input" type="text" readonly />
        <p class="small"></p>
      </fieldset>
      <fieldset style="margin: 5px 0; max-width: 300px; margin: 0 auto">
        <input data-bind="value: password" class="input" type="password" placeholder="Password" autofocus="true" />
        <p class="has-text-danger" data-bind="text: passwordMessage"></p>
      </fieldset>
      <fieldset style="margin: 5px 0; max-width: 300px; margin: 0 auto">
        <input data-bind="value: vpassword" class="input" type="password" placeholder="Verify password" />
        <p class="has-text-danger" data-bind="text: vpasswordMessage"></p>
      </fieldset>
      <fieldset style="margin: 5px 0">
        <button class="button is-rounded is-primary" data-bind="click: setPassword">Set Password</button>
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
            this.isLoggedInParent()
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