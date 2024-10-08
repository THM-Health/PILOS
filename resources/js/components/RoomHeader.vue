<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col-reverse md:flex-row gap-2">
      <div class="grow">
        <!-- Display room type, name and owner  -->
        <RoomTypeBadge :room-type="props.room.type" />
        <h1 class="text-3xl my-2 text-color">
          {{ props.room.name }}
        </h1>

        <RoomDetailsList
          :room="props.room"
          :show-description="true"
          :inline="detailsInline"
        />
      </div>
      <div class="shrink-0 flex justify-end items-start">
        <div class="flex gap-2">
          <!-- Reload general room settings/details -->
          <Button
            v-tooltip="$t('app.reload')"
            :aria-label="$t('app.reload')"
            severity="secondary"
            :disabled="props.loading"
            @click="emit('reload')"
            :icon="props.loading ? 'pi pi-spin pi-spinner' : 'fa-solid fa-sync'"
          />
          <RoomFavoriteButton
            v-if="!hideFavorites && authStore.isAuthenticated"
            :room="props.room"
            @favorites-changed="emit('reload')"
            :no-redirect-on-unauthenticated="true"
          />
          <RoomMembershipButton
            v-if="!hideMembership && authStore.isAuthenticated"
            :room="props.room"
            :access-code="props.accessCode"
            @joinedMembership="emit('joinedMembership')"
            @leftMembership="emit('reload')"
            @invalidCode="emit('invalidCode')"
            @membershipDisabled="emit('reload')"
          />
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
import { useAuthStore } from '../stores/auth.js';

const authStore = useAuthStore();

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
  },
  accessCode: {
    type: Number,
    required: false
  }
});

const emit = defineEmits(['joinedMembership', 'reload', 'invalidCode']);

</script>
