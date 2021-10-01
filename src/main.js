//import { createApp } from 'vue'
import { createApp } from 'vue/dist/vue.cjs.prod.js'
import { createRouter, createWebHashHistory } from 'vue-router'
import Vue3TouchEvents from 'vue3-touch-events'

import VueClickAway from "vue3-click-away";

import App from './App.vue'
import Home from './components/Home.vue'
import Playlists from './components/Playlists.vue'
import Playlist from './components/Playlist.vue'
import Albums from './components/Albums.vue'
import Artists from './components/Artists.vue'
import Artist from './components/Artist.vue'
import Album from './components/Album.vue'
import Genres from './components/Genres.vue'
import Genre from './components/Genre.vue'
import Settings from './components/Settings.vue'

import { DatabaseHandler } from './database_remote.js'
import * as player from './player_remote.js'

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

const router = new createRouter({
  history: createWebHashHistory(),
  scrollBehavior,
  routes: [
    { path: '/', name: 'Home', component: Home, props: true, meta: { scrollToTop: true } },
    {
      path: '/playlists',
      name: 'playlists-home',
      component: { template: '<router-view></router-view>' },
      children: [
        { path: '', name: 'Playlists', component: Playlists, meta: { scrollToTop: true } },
        { path: ':id', name: 'Playlist', component: Playlist, meta: { scrollToTop: true } }
      ]
    },
    {
      path: '/artists',
      name: 'artists-home',
      component: { template: '<router-view></router-view>' },
      children: [
        { path: '', name: 'Artists', component: Artists, meta: { scrollToTop: true } },
        { path: ':artist', name: 'Artist', component: Artist, meta: { scrollToTop: true } }
      ]
    },
    {
      path: '/albums',
      name: 'albums-home',
      component: { template: '<router-view></router-view>' },
      children: [
        { path: '', name: 'Albums', component: Albums, meta: { scrollToTop: true } },
        { path: ':artist/:album', name: 'Album', component: Album, meta: { scrollToTop: true } }
      ]
    },
    {
      path: '/genres',
      name: 'genres-home',
      component: { template: '<router-view></router-view>' },
      children: [
        { path: '', name: 'Genres', component: Genres, meta: { scrollToTop: true } },
        { path: ':genre', name: 'Genre', component: Genre, meta: { scrollToTop: true } }
      ]
    },
    { path: '/settings', name: 'Settings', component: Settings, meta: { scrollToTop: true } }
  ]
})

const app = createApp(App)
app.use(router)
app.use(Vue3TouchEvents, { swipeTolerance: 100 })
app.use(VueClickAway)

app.config.globalProperties.$player = player
app.config.globalProperties.$innerWidth = window.innerWidth
app.config.globalProperties.$database = new DatabaseHandler()
app.mount('#app')