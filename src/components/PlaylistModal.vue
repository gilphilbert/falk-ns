<template>
  <div class="modal is-small modal-fx-3dSignDown" :class="{ 'is-active': show }">
    <div class="modal-content">
      <div class="box">
        <h1>Select Playlist</h1>
        <label class="radio-container" v-for="playlist in playlists">
          <p class="is-4">{{ playlist.title }}</p>
          <input type="radio" name="radio" :value="playlist.id" v-model="selected">
          <span class="checkmark"></span>
        </label>

        <label class="radio-container">
          <p class="is-4">New Playlist...</p>
          <input type="radio" name="radio" value="new" v-model="selected">
          <span class="checkmark"></span>
        </label>
        <input class="input" type="text" placeholder="Playlist name" v-model="newName" :class="{ 'is-hidden': selected !== 'new' }" />

        <button class="button is-rounded" @click="cancel">Cancel</button>
        <button class="button is-rounded is-primary" @click="save">Save</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlaylistModal',
  props: [ 'show', 'selectedId' ],
  created () {
    this.$database.getPlaylists()
      .then(data => {
        console.log(data)
        this.playlists = data
      })
  },
  data () {
    return {
      playlists: [],
      selected: '',
      newName: ''
    }
  },
  methods: {
    cancel () {
      this.$emit('close')
      this.showNew = false
    },
    save() {
      if (this.selected === '')
        return

      if (this.selected === 'new') {
        this.$database.newPlaylist(this.newName, this.selectedId)
      } else {
        this.$database.addToPlaylist(this.selected, this.selectedId)
      }
    }
  }
}
</script>

<style lang="css" scoped>
.radio-container {
  display: block;
  position: relative;
  padding-left: 35px;
  margin-bottom: 12px;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.radio-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 20px;
  width: 20px;
  border: 3px solid var(--text-color);
  border-radius: 50%;
}

.radio-container:hover input ~ .checkmark {
  //background-color: var(--text-color);
}

.radio-container input:checked ~ .checkmark {
  //border-color: var(--primary);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.radio-container input:checked ~ .checkmark:after {
  display: block;
}

.radio-container .checkmark:after {
  top: 3px;
  left: 3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  //background: var(--primary);
  background: var(--text-color);
}
</style>