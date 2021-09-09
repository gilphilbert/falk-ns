<template>
  <div class="modal-mask" v-if="this.show">
    <div class="modal-wrapper">
      <div class="modal-container">

        <div class="modal-header">
          <slot name="header">
            default header
          </slot>
        </div>

        <div class="modal-body">
          <slot name="body">
            default body
          </slot>
        </div>

        <div class="modal-footer">
          <slot name="footer">
            default footer
            <button class="modal-default-button" @click="$emit('close')">
              OK
            </button>
          </slot>
        </div>
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