<template>
  <Button
    :severity="props.room.is_favorite ? 'primary' : 'secondary'"
    v-tooltip="props.room.is_favorite ? $t('rooms.favorites.remove') : $t('rooms.favorites.add')"
    :aria-label="props.room.is_favorite ? $t('rooms.favorites.remove') : $t('rooms.favorites.add')"
    icon="fa-solid fa-star"
    size="small"
    @click.stop="toggleFavorite"
  />
</template>

<script setup>
import { useApi } from '../composables/useApi.js';

const api = useApi();

const props = defineProps({
  room: Object
});

const emit = defineEmits(['favoritesChanged']);

/**
 * Add a room to the favorites or delete it from the favorites
 */
function toggleFavorite () {
  let config;
  // check if the room must be added or deleted
  if (props.room.is_favorite) {
    config = { method: 'delete' };
  } else {
    config = { method: 'post' };
  }
  // add or delete room
  api.call('rooms/' + props.room.id + '/favorites', config)
    .catch(error => {
      api.error(error);
    }).finally(() => {
      emit('favoritesChanged');
    });
}
</script>
