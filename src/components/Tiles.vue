<template>
<div class="row art-container">
  <div class="col-lg-2 col-xs-4 art has-text-centered item-tile" v-for="tile in tiles" :key="tile">
    <router-link :to="{ name: tile.urlParams.name, params: tile.urlParams.params }">
      <figure class="image is-1by1"><img v-bind:src="((tile.art !== '') ? tile.art : '/img/placeholder.png')" load="lazy"></figure>
      <p class="is-5 is-capitalized">{{ tile.title }}</p>
    </router-link>
    <router-link :to="{ name: tile.surlParams.name, params: tile.surlParams.params }" v-if="tile.surlParams !== false">
      <p class="subtitle is-5 is-capitalized">{{ tile.subtitle }}</p>
    </router-link>
    <p v-else class="subtitle is-5 is-capitalized">{{ tile.subtitle }}</p>
  </div>
</div>
</template>
<script>
export default {
  name: 'Tiles',
  props: [ 'tiles' ]
}
</script>
<style scoped></style>
