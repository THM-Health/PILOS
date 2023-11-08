<template>
  <b-dropdown-item-button
    @click.stop="toggleFavorite"
  >
    <div class="d-flex">
      <i class="fa-solid fa-star"></i>
      <span v-if="isFavorite">{{ $t('rooms.favorites.remove') }}</span>
      <span v-else>{{ $t('rooms.favorites.add') }}</span>
    </div>
  </b-dropdown-item-button>
</template>

<script>
import Base from '../../api/base';

export default {
  props: {
    id: String,
    isFavorite: Boolean,
    size: String
  },
  methods: {
    /**
     * Add a room to the favorites or delete it from the favorites
     */
    toggleFavorite: function () {
      let config;
      // check if the room must be added or deleted
      if (this.isFavorite) {
        config = { method: 'delete' };
      } else {
        config = { method: 'post' };
      }
      // add or delete room
      Base.call('rooms/' + this.id + '/favorites', config)
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
