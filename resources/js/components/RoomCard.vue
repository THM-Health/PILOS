<template>
  <div class="h-full">
    <!-- room card-->
    <div
      tabindex="0"
      data-test="room-card"
      class="relative h-full border shadow-none border-surface rounded-border hover:bg-emphasis"
      :class="{ '!border-green-500': running }"
      @click="open"
      @keyup.enter="open"
    >
      <div class="h-100 p-4">
        <div class="h-100 flex flex-col">
          <div class="grow">
            <div class="flex items-start justify-between">
              <RoomTypeBadge :room-type="props.room.type" />
              <div class="relative z-10 flex shrink-0 gap-2">
                <Button
                  v-if="props.room.short_description != null"
                  severity="secondary"
                  class="h-8 w-8 p-0 text-sm"
                  icon="fa-solid fa-info"
                  data-test="room-info-button"
                  @click.stop="modalVisible = true"
                />
                <RoomFavoriteButton
                  :room="props.room"
                  class="h-8 w-8 p-0 text-sm"
                  @favorites-changed="$emit('favoritesChanged')"
                />
              </div>
            </div>
            <p
              class="text-break mb-4 mt-2 font-bold text-color"
              style="width: 100%"
            >
              {{ props.room.name }}
            </p>
          </div>
          <RoomDetailsList :room="props.room" />
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
      v-model:visible="modalVisible"
      modal
      :header="$t('rooms.index.room_component.details')"
      :style="{ width: '500px' }"
      :breakpoints="{ '575px': '90vw' }"
      :draggable="false"
      data-test="room-info-dialog"
    >
      <div class="mt-2 flex items-start justify-between">
        <RoomTypeBadge :room-type="props.room.type" />
        <div class="room-card-buttons shrink-0">
          <RoomFavoriteButton
            :room="props.room"
            @favorites-changed="$emit('favoritesChanged')"
          />
        </div>
      </div>
      <h1 class="text-break mb-4 text-2xl font-semibold" style="width: 100%">
        {{ props.room.name }}
      </h1>
      <RoomDetailsList :room="props.room" :show-description="true" />
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
  </div>
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

function open() {
  router.push(link.value);
}

function handleCancel() {
  modalVisible.value = false;
}
</script>
