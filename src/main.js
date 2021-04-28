import Vue from 'vue'
import VueRouter from 'vue-router'
import Swipes from './swipes.js'
import { LocalPlayer } from './player.js'
import { DatabaseHandler } from './database.js'

import App from './App.vue'
import Home from './components/Home.vue'
import Albums from './components/Albums.vue'
import Artists from './components/Artists.vue'
import Artist from './components/Artist.vue'
import Album from './components/Album.vue'
import Genres from './components/Genres.vue'
import Genre from './components/Genre.vue'
import Settings from './components/Settings.vue'

Vue.use(VueRouter)
const scrollBehavior = (to, from, savedPosition) => {
  if (savedPosition) {
    // savedPosition is only available for popstate navigations.
    return savedPosition
  } else {
    const position = {}
    // new navigation.
    // scroll to anchor by returning the selector
    if (to.hash) {
      position.selector = to.hash
      console.log(to)

      // specify offset of the element
      if (to.hash === '#anchor2') {
        position.offset = { y: 100 }
      }
    }
    // check if any matched route config has meta that requires scrolling to top
    if (to.matched.some(m => m.meta.scrollToTop)) {
      // cords will be used if no selector is provided,
      // or if the selector didn't match any element.
      position.x = 0
      position.y = 0
    }
    // if the returned position is falsy or an empty object,
    // will retain current scroll position.
    return position
  }
}

const router = new VueRouter({
  mode: 'hash',
  scrollBehavior,
  routes: [
    { path: '/', component: Home, props: true, meta: { scrollToTop: true }},
    { path: '/albums', component: Albums, meta: { scrollToTop: true }},
    { path: '/artists', component: Artists, meta: { scrollToTop: true }},
    { path: '/artist/:artist', component: Artist, meta: { scrollToTop: true }},
    { path: '/album/:artist/:album', component: Album, meta: { scrollToTop: true }},
    { path: '/genres', component: Genres, meta: { scrollToTop: true }},
    { path: '/genre/:genre', component: Genre, meta: { scrollToTop: true }},
    { path: '/settings', component: Settings, meta: { scrollToTop: true }}
  ]
})

Vue.prototype.$innerWidth = window.innerWidth

Vue.prototype.$player = new LocalPlayer()

Vue.use(Swipes)

Vue.prototype.$database = new DatabaseHandler(() => {
  new Vue({
    router,
    render: h => h(App)
  }).$mount('#app')
})