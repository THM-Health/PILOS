<!--
SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <!-- room card-->
  <li
    data-test="room-card"
    class="room-card relative h-full rounded-border border border-surface shadow-none hover:bg-emphasis"
  >
    <span v-if="running" class="absolute -top-1.5 -right-1.5 flex h-3 w-3">
      <span
        class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
      ></span>
      <span
        class="relative inline-flex h-3 w-3 rounded-full bg-green-500"
      ></span>
    </span>
    <div class="p-4">
      <div class="flex grow flex-col">
        <router-link class="stretched-link order-1" :to="link">
          <h2
            class="text-break mt-2 mb-4 font-bold text-color"
            style="width: 100%"
          >
            {{ props.room.name }}
          </h2>
        </router-link>
        <RoomTypeBadge class="sr-only" :room-type="props.room.type" />
        <RoomDetailsList class="order-2" :room="props.room" />
        <div class="order-0 flex items-start justify-between">
          <RoomTypeBadge aria-hidden="true" :room-type="props.room.type" />
          <div class="relative z-10 flex shrink-0 gap-2">
            <Button
              v-if="props.room.short_description != null"
              v-tooltip="$t('rooms.index.room_component.show_details')"
              severity="secondary"
              class="room-card-button h-8 w-8 p-0 text-sm"
              icon="fa-solid fa-info"
              data-test="room-info-button"
              :aria-label="
                $t('rooms.index.room_component.show_details_for', {
                  room: props.room.name,
                })
              "
              @click.stop="modalVisible = true"
            />
            <RoomFavoriteButton
              :room="props.room"
              class="room-card-button h-8 w-8 p-0 text-sm"
              :redirect-on-room-model-not-found="false"
              @favorites-changed="$emit('favoritesChanged')"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- More details modal-->
    <Dialog
      v-model:visible="modalVisible"
      modal
      :header="$t('rooms.index.room_component.details')"
      :style="{ width: '500px' }"
      :breakpoints="{ '575px': '90vw' }"
      :draggable="false"
      data-test="room-info-dialog"
    >
      <div class="flex flex-col">
        <h1
          class="text-break order-1 mb-4 text-2xl font-semibold"
          style="width: 100%"
        >
          {{ props.room.name }}
        </h1>
        <div class="order-0 mt-2 flex items-start justify-between">
          <RoomTypeBadge :room-type="props.room.type" />
          <div class="room-card-buttons shrink-0">
            <RoomFavoriteButton
              :room="props.room"
              :redirect-on-room-model-not-found="false"
              @favorites-changed="$emit('favoritesChanged')"
            />
          </div>
        </div>
        <RoomDetailsList
          class="order-2"
          :room="props.room"
          :show-description="true"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            :label="$t('app.close')"
            severity="secondary"
            data-test="dialog-cancel-button"
            @click="handleCancel"
          />
          <Button
            as="router-link"
            :to="link"
            :label="$t('rooms.index.room_component.open')"
            data-test="dialog-continue-button"
          />
        </div>
      </template>
    </Dialog>
  </li>
</template>
<script setup>
import { useRouter } from "vue-router";
import { computed, ref } from "vue";

const router = useRouter();

defineEmits(["favoritesChanged"]);

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  modalStatic: {
    type: Boolean,
    default: false,
  },
});

/**
 * Link to the room view
 */
const link = computed(() => {
  return router.resolve({ name: "rooms.view", params: { id: props.room.id } })
    .href;
});

/**
 * Check if there is a running meeting for this room
 */
const running = computed(() => {
  return props.room.last_meeting != null && props.room.last_meeting.end == null;
});

/**
 * Details modal
 */
const modalVisible = ref(false);

function handleCancel() {
  modalVisible.value = false;
}
</script>
