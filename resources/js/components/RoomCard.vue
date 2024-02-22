<template>
  <div class="h-full">
    <!-- room card-->
    <div
      tabindex="0"
      class="room-card h-full relative"
      :class="{'room-card--running': running}"
      @click="open"
      @keyup.enter="open"
    >
      <div class="p-3 h-100">
        <div class="flex flex-column h-100">
          <div class="flex-grow-1">
            <div class="flex justify-content-between align-items-start">
              <RoomTypeBadge
                :room-type="props.room.type"
              />
              <div class="room-card__buttons flex-shrink-0">
                <Button
                  v-if="props.room.short_description!=null"
                  severity="secondary"
                  icon="fa-solid fa-info"
                  @click.stop="showModal = true"
                />
                <room-favorite-button
                  :room="props.room"
                  @favorites-changed="$emit('favoritesChanged')"
                />
              </div>
            </div>
            <p
              class="mt-2 text-break font-bold"
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
    >

      <div class="flex justify-content-between align-items-start mt-2">
        <RoomTypeBadge :room-type="props.room.type" />
        <div class="room-card-buttons flex-shrink-0">
          <room-favorite-button
            :room="props.room"
            @favorites-changed="$emit('favoritesChanged')"
          />
        </div>
      </div>
      <h5
        class="mt-2 text-break "
        style="width: 100% "
      >
        {{ props.room.name }}
      </h5>
      <RoomDetailsList
        :room="props.room"
        :show-description="true"
      />
      <template #footer>
        <div class="flex justify-content-end gap-2">
          <Button :label="$t('app.close')" outlined @click="handleCancel" />
          <router-link :to="link" class="p-button">
            {{ $t('rooms.index.room_component.open') }}
          </router-link>
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
function handleOk () {
  showModal.value = false;
  router.push(link.value);
}

function open () {
  router.push(link.value);
}

function handleCancel () {
  showModal.value = false;
}

</script>
