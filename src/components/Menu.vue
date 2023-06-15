<template>
<aside class="menu" :class="{ 'is-active': isActive }" @click="hideMenu">
  <figure class="image menu-brand">
    <router-link :to="{ name: 'Home' }">
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="isolation:isolate" viewBox="0 0 39.961 39.961" width="40px" height="40px"><circle vector-effect="non-scaling-stroke" cx="19.9805" cy="19.9805" r="15.5" fill="rgb(255,255,255)"/><path d=" M 0 19.981 C 0 8.953 8.953 0 19.981 0 C 31.008 0 39.961 8.953 39.961 19.981 C 39.961 31.008 31.008 39.961 19.981 39.961 C 8.953 39.961 0 31.008 0 19.981 Z  M 15.089 28.897 L 15.089 28.897 L 10.274 28.897 L 10.274 28.897 Q 10.045 28.897 9.879 28.732 L 9.879 28.732 L 9.879 28.732 Q 9.714 28.566 9.714 28.413 L 9.714 28.413 L 9.714 28.413 Q 9.714 28.26 9.739 28.184 L 9.739 28.184 L 15.293 11.905 L 15.293 11.905 Q 15.522 11.064 16.439 11.064 L 16.439 11.064 L 23.522 11.064 L 23.522 11.064 Q 24.439 11.064 24.668 11.905 L 24.668 11.905 L 30.222 28.184 L 30.222 28.184 Q 30.248 28.26 30.248 28.413 L 30.248 28.413 L 30.248 28.413 Q 30.248 28.566 30.082 28.732 L 30.082 28.732 L 30.082 28.732 Q 29.916 28.897 29.687 28.897 L 29.687 28.897 L 24.872 28.897 L 24.872 28.897 Q 24.057 28.897 23.726 28.031 L 23.726 28.031 Q 20.444 17.551 19.981 15.981 Q 19.516 17.591 16.236 28.031 L 16.236 28.031 Q 15.904 28.897 15.089 28.897 L 15.089 28.897 L 15.089 28.897 Z " fill-rule="evenodd" fill="rgb(77,132,195)"/></svg>
    </router-link>
  </figure>
  <ul class="menu-list">
    <li>
      <router-link :to="{ name: 'Home' }">
        <svg class="feather"><use href="/img/feather-sprite.svg#play"></use></svg>
        <div class="detail">Playing</div>
      </router-link>
    </li>
    <li><router-link :to="{ name: 'Playlists' }"><svg class="feather"><use href="/img/feather-sprite.svg#list"></use></svg><div class="detail">Playlists</div></router-link></li>
    <li><router-link :to="{ name: 'Artists' }"><svg class="feather"><use href="/img/feather-sprite.svg#mic"></use></svg><div class="detail">Artists</div></router-link></li>
    <li><router-link :to="{ name: 'Albums' }"><svg class="feather"><use href="/img/feather-sprite.svg#disc"></use></svg><div class="detail">Albums</div></router-link></li>
    <li><router-link :to="{ name: 'Genres' }"><svg class="feather"><use href="/img/feather-sprite.svg#music"></use></svg><div class="detail">Genres</div></router-link></li>
    <li><router-link :to="{ name: 'Settings' }"><svg class="feather"><use href="/img/feather-sprite.svg#settings"></use></svg><div class="detail">Settings</div></router-link></li>
  </ul>

  <ul class="menu-list right">
    <li>
      <div style="position: relative">
        <!--<p class="is-6 tag is-rounded">Everything</p>-->
        <div class="dropdown is-right" :class="{ 'is-active': filterActive }" v-click-away="clickedAway">
          <span @click="filterActive = !filterActive"> <!--  -->
            <p class="is-6 tag is-rounded">{{ filterText }}</p>
          </span>
          <div class="dropdown-content">
            <span class="dropdown-item" @click="changeFilter('all')">Everything</span>
            <span class="dropdown-item" @click="changeFilter('lossless')">Lossless</span>
            <span class="dropdown-item" @click="changeFilter('hires')">Hires</span>
          </div>
        </div>
      </div>
    </li>
    <li>
      <div style="position: relative">
        <input class="input" type="text" v-model="searchQuery" @keyup.enter="fullSearch" />
        <svg class="feather" style="display: block; position: absolute; top: 6px; right: 6px; pointer-events: none"><use href="/img/feather-sprite.svg#search"></use></svg>
      </div>
    </li>
  </ul>

</aside>
</template>
<script>
import { emit } from 'process'

export default {
  name: 'Menu',
  props: [ 'isActive', 'scanPercent', 'scanning', 'filter' ],
  data () {
    return {
      searchQuery: '',
      filterActive: false,
      //filter: 0
    }
  },
  methods: {
    onSwipe(mouseEvent) {
      console.log(mouseEvent)
    },
    hideMenu () {
      this.$emit('hide')
    },
    fullSearch () {
      this.$router.push({ name: 'Search', params: { query: this.searchQuery } })
    },
    clickedAway() {
      this.filterActive = false
    },
    changeFilter(type) {
      switch (type) {
        case 'all':
          this.$emit('setFilter', 0)
          break
        case 'lossless':
          this.$emit('setFilter', 1)
          break
        case 'hires':
          this.$emit('setFilter', 2)
      }
      this.filterActive = false
    }
  },
  computed: {
    degrees: function () {
      return 360 * this.scanPercent / 100
    },
    filterText: function () {
      return this.filter == 0 ? 'Everything' :
        this.filter == 1 ? 'Lossless':
        'Hires'
    }
  },
  watch: {
    searchQuery(query) {
      this.$emit('query', query)
    }
  }
}
</script>
<style scoped>
.fade {
    -webkit-animation: fadeinout 1s infinite;
    animation: fadeinout 1s infinite;
    background: var(--yellow)
}

@-webkit-keyframes fadeinout {
  0%,100% { opacity: 0; }
  50% { opacity: 1; }
}

@keyframes fadeinout {
  0%,100% { opacity: 0; }
  50% { opacity: 1; }
}

input {
  background: transparent;
  border-color: transparent;
  transition: all 0.3s
}

input:focus {
  background: var(--blue);
}
</style>