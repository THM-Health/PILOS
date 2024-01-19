<template>
  <b-dropdown-item-button
    @click.stop="toggleFavorite"
  >
    <div class="flex align-items-baseline">
      <i class="fa-solid fa-star" />
      <span v-if="room.is_favorite">{{ $t('rooms.favorites.remove') }}</span>
      <span v-else>{{ $t('rooms.favorites.add') }}</span>
    </div>
  </b-dropdown-item-button>
</template>

<script>
import Base from '@/api/base';

export default {

  name: 'RoomFavoriteDropdownButton',

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
          this.$emit('favoritesChanged');
        }).catch(error => {
          Base.error(error, this);
        });
    }
  }

};
</script>
