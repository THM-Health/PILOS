<template>
  <div class="flex flex-column gap-4">
    <div class="flex flex-row gap-2">
      <div class="flex-grow-1">
        <!-- Display room type, name and owner  -->
        <RoomTypeBadge :room-type="props.room.type" />
        <h1 class="text-3xl mt-2 roomname text-color">
          {{ props.room.name }}
        </h1>

        <RoomDetailsList
          :room="props.room"
          :show-description="true"
          :inline="detailsInline"
        />
      </div>
      <div class="flex-shrink-0 flex justify-content-end align-items-start">
        <div class="flex gap-2">
          <!-- Reload general room settings/details -->
          <Button
            v-tooltip="$t('app.reload')"
            :aria-label="$t('app.reload')"
            severity="secondary"
            :disabled="props.loading"
            @click="emit('reload')"
            icon="fa-solid fa-sync"
            :loading="props.loading"
          />
          <RoomFavoriteButton v-if="!hideFavorites" :room="props.room" @favorites-changed="emit('reload')" />
          <RoomMembershipButton v-if="!hideMembership" :room="props.room" @added="emit('reload')" @removed="emit('reload')" />
        </div>
      </div>
    </div>
    <div>
      <InlineNote v-if="props.room.last_meeting?.detached" severity="warn" icon="fa-solid fa-triangle-exclamation" :closable="false">
        {{ $t('rooms.connection_error.detached') }}
      </InlineNote>

      <InlineNote v-else-if="props.room.last_meeting?.server_connection_issues" severity="warn" icon="fa-solid fa-triangle-exclamation" :closable="false">
        {{ $t('rooms.connection_error.reconnecting') }}
      </InlineNote>
    </div>
  </div>
</template>
<script setup>

const props = defineProps({
  room: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  detailsInline: {
    type: Boolean,
    default: false
  },
  hideFavorites: {
    type: Boolean,
    default: false
  },
  hideMembership: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['reload']);

</script>
