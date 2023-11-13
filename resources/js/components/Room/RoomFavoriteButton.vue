<template>
  <b-button
    @click.stop="toggleFavorite"
    :variant="room.is_favorite ? 'primary' : 'secondary'"
    :title="room.is_favorite ? $t('rooms.favorites.remove') : $t('rooms.favorites.add')"
    :aria-label="room.is_favorite ? $t('rooms.favorites.remove') : $t('rooms.favorites.add')"
    v-b-tooltip.hover
    v-tooltip-hide-click
    class="fa-solid fa-star"
  >
  </b-button>
</template>

<script>
import Base from '../../api/base';

export default {
  props: {
    room: Object
  },
  methods: {
    /**
     * Add a room to the favorites or delete it from the favorites
     */
    toggleFavorite: function () {
      let config;
      // check if the room must be added or deleted
      if (this.room.is_favorite) {
        config = { method: 'delete' };
      } else {
        config = { method: 'post' };
      }
      // add or delete room
      Base.call('rooms/' + this.room.id + '/favorites', config)
        .then(response => {
        }).catch(error => {
          Base.error(error, this);
        }).finally(() => {
          this.$emit('favorites_changed');
        });
    }
  }

};
</script>
