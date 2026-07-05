<!--
SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <Button
    v-tooltip="
      props.room.is_favorite
        ? $t('rooms.favorites.remove')
        : $t('rooms.favorites.add')
    "
    data-test="room-favorites-button"
    :severity="props.room.is_favorite ? 'contrast' : 'secondary'"
    :aria-label="
      props.room.is_favorite
        ? $t('rooms.favorites.remove_for', { room: props.room.name })
        : $t('rooms.favorites.add_for', { room: props.room.name })
    "
    :icon="isLoading ? 'pi pi-spin pi-spinner' : 'fa-solid fa-star'"
    :disabled="isLoading"
    @click.stop="toggleFavorite"
  />
</template>

<script setup>
import { useApi } from "../composables/useApi.js";
import { ref } from "vue";

const api = useApi();

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  redirectOnUnauthenticated: {
    type: Boolean,
    default: true,
  },
  redirectOnRoomModelNotFound: {
    type: Boolean,
    default: true,
  },
});

const isLoading = ref(false);

const emit = defineEmits(["favoritesChanged"]);

/**
 * Add a room to the favorites or delete it from the favorites
 */
function toggleFavorite() {
  isLoading.value = true;
  let config;
  // check if the room must be added or deleted
  if (props.room.is_favorite) {
    config = { method: "delete" };
  } else {
    config = { method: "post" };
  }
  // add or delete room
  api
    .call("rooms/" + props.room.id + "/favorites", config)
    .catch((error) => {
      api.error(error, {
        redirectOnUnauthenticated: props.redirectOnUnauthenticated,
        redirectOnRoomModelNotFound: props.redirectOnRoomModelNotFound,
      });
    })
    .finally(() => {
      emit("favoritesChanged");
      isLoading.value = false;
    });
}
</script>
