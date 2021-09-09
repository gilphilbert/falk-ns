<template>
  <div class="modal is-small modal-fx-3dSignDown is-active" v-if="this.show">
    <div class="modal-content">
      <div class="box">
        <h1>Select Playlist</h1>
        <table class="table is-fullwidth table-hover">
          <tbody>

          </tbody>
        </table>
        <div>
          <button class="button is-rounded is-primary">+ New Playlist</button>
          <input class="input is-hidden" type="text" placeholder="Playlist name" />
          <p class="help is-danger is-6"></p>
        </div>
        <button class="button is-rounded" @click="$emit('close')">Cancel</button>
        <button class="button is-rounded is-primary">Save</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlaylistModal',
  props: [ 'show' ],
}
</script>

<style lang="css">
  .modal-mask {
    position: fixed;
    display: flex;
    z-index: 100;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: rgba(0,0,0,0.5);
  }
  .modal-container {
    width: 400px;
  }
  .modal-body {
    background: red;
  }
</style>