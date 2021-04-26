<template>
<div class="row art-container">
  <div class="col-lg-2 col-xs-4 art has-text-centered item-tile" v-for="tile in tiles">
    <router-link :to="tile.url">
      <figure class="image is-1by1"><img v-bind:src="tile.art" load="lazy"></figure>
      <p class="is-5 is-capitalized">{{ tile.title }}</p>
    </router-link>
    <router-link :to="tile.surl" v-if="tile.surl !== ''">
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
