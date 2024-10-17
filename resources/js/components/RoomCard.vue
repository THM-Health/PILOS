<template>
  <div class="h-full">
    <!-- room card-->
    <div
      tabindex="0"
      data-test="room-card"
      class="h-full relative border border-surface rounded-border shadow-none hover:bg-emphasis"
      :class="{'!border-green-500': running}"
      @click="open"
      @keyup.enter="open"
    >
      <div class="p-4 h-100">
        <div class="flex flex-col h-100">
          <div class="grow">
            <div class="flex justify-between items-start">
              <RoomTypeBadge
                :room-type="props.room.type"
              />
              <div class="z-10 relative shrink-0 flex gap-2">
                <Button
                  v-if="props.room.short_description!=null"
                  severity="secondary"
                  class="p-0 h-8 w-8 text-sm"
                  icon="fa-solid fa-info"
                  data-test="room-info-button"
                  @click.stop="showModal = true"
                />
                <RoomFavoriteButton
                  :room="props.room"
                  class="p-0 h-8 w-8 text-sm"
                  @favorites-changed="$emit('favoritesChanged')"
                />
              </div>
            </div>
            <p
              class="mt-2 mb-4 text-break font-bold text-color"
              style="width: 100% "
            >
              {{ props.room.name }}
            </p>
          </div>
          <RoomDetailsList
            :room="props.room"
          />
        </div>
        <router-link
          tabindex="-1"
          class="stretched-link"
          :to="link"
          aria-hidden="true"
        />
      </div>
    </div>

    <!-- More details modal-->
    <Dialog
      v-model:visible="showModal"
      modal
      :header="$t('rooms.index.room_component.details')"
      :style="{ width: '500px' }"
      :breakpoints="{ '575px': '90vw' }"
      :draggable="false"
      data-test="room-info-dialog"
    >

      <div class="flex justify-between items-start mt-2">
        <RoomTypeBadge :room-type="props.room.type" />
        <div class="room-card-buttons shrink-0">
          <RoomFavoriteButton
            :room="props.room"
            @favorites-changed="$emit('favoritesChanged')"
          />
        </div>
      </div>
      <h1
        class="text-2xl font-semibold mb-4 text-break"
        style="width: 100% "
      >
        {{ props.room.name }}
      </h1>
      <RoomDetailsList
        :room="props.room"
        :show-description="true"
      />
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button :label="$t('app.close')" severity="secondary" @click="handleCancel" data-test="dialog-cancel-button"/>
          <Button as="router-link" :to="link" :label="$t('rooms.index.room_component.open')" data-test="dialog-continue-button"/>
        </div>
      </template>
    </Dialog>
  </div>
</template>
<script setup>

import { useRouter } from 'vue-router';
import { computed, ref } from 'vue';

const router = useRouter();

const props = defineProps({
  room: Object,
  modalStatic: {
    type: Boolean,
    default: false
  }
});

/**
 * Link to the room view
 */
const link = computed(() => {
  return router.resolve({ name: 'rooms.view', params: { id: props.room.id } }).href;
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
const showModal = ref(false);

function open () {
  router.push(link.value);
}

function handleCancel () {
  showModal.value = false;
}

</script>
