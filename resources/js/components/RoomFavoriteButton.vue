<template>
  <Button
    data-test="room-favorites-button"
    :severity="props.room.is_favorite ? 'contrast' : 'secondary'"
    v-tooltip="props.room.is_favorite ? $t('rooms.favorites.remove') : $t('rooms.favorites.add')"
    :aria-label="props.room.is_favorite ? $t('rooms.favorites.remove') : $t('rooms.favorites.add')"
    :icon="isLoading ? 'pi pi-spin pi-spinner' : 'fa-solid fa-star'"
    @click.stop="toggleFavorite"
    :disabled="isLoading"
  />
</template>

<script setup>
import { useApi } from '../composables/useApi.js';
import { ref } from 'vue';

const api = useApi();

const props = defineProps({
  room: Object,
  noRedirectOnUnauthenticated: {
    type: Boolean,
    default: false
  }
});

const isLoading = ref(false);

const emit = defineEmits(['favoritesChanged']);

/**
 * Add a room to the favorites or delete it from the favorites
 */
function toggleFavorite () {
  isLoading.value = true;
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
      api.error(error, { noRedirectOnUnauthenticated: props.noRedirectOnUnauthenticated });
    }).finally(() => {
      emit('favoritesChanged');
      isLoading.value = false;
    });
}
</script>
