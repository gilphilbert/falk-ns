import Vue from 'vue'
import App from './App.vue'

Vue.prototype.$innerWidth = window.innerWidth

import { LocalPlayer } from './player.js'
Vue.prototype.$player = new LocalPlayer()

import { DatabaseHandler } from './database.js'
Vue.prototype.$database = new DatabaseHandler(() => {
  new Vue({
    render: h => h(App)
  }).$mount('#app')
})