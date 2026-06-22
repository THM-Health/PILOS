<template>
  <div class="flex flex-col gap-6">
    <RoomBBBMessage :reason="bbbReason" :errors="bbbErrors" />

    <div class="flex flex-col-reverse gap-2 md:flex-row">
      <div class="flex grow flex-col items-start">
        <!-- Display room type, name and owner  -->
        <h1 class="order-2 my-2 text-3xl text-color">
          {{ props.room.name }}
        </h1>

        <RoomTypeBadge class="order-1" :room-type="props.room.type" />
        <RoomDetailsList
          class="order-3"
          :room="props.room"
          :show-description="true"
          :inline="detailsInline"
        />
      </div>
      <div class="flex shrink-0 items-start justify-end">
        <div class="flex gap-2">
          <!-- Reload general room settings/details -->
          <Button
            v-tooltip="$t('app.reload')"
            :aria-label="$t('app.reload')"
            severity="secondary"
            :disabled="props.loading || disableReload"
            :loading="props.loading"
            icon="fa-solid fa-sync"
            data-test="reload-room-button"
            @click="emit('reload')"
          />
          <RoomFavoriteButton
            v-if="!hideFavorites && authStore.isAuthenticated"
            :room="props.room"
            :redirect-on-unauthenticated="false"
            @favorites-changed="emit('reload')"
          />
          <RoomMembershipButton
            v-if="!hideMembership && authStore.isAuthenticated"
            :room="props.room"
            :room-auth-token="roomAuthToken"
            @joined-membership="emit('joinedMembership')"
            @left-membership="emit('leftMembership')"
            @invalid-room-auth-token="emit('invalidRoomAuthToken')"
            @membership-disabled="emit('reload')"
          />
        </div>
      </div>
    </div>
    <div>
      <InlineNote
        v-if="props.room.last_meeting?.detached"
        severity="warn"
        icon="fa-solid fa-triangle-exclamation"
        :closable="false"
      >
        {{ $t("rooms.connection_error.detached") }}
      </InlineNote>

      <InlineNote
        v-else-if="props.room.last_meeting?.server_connection_issues"
        severity="warn"
        icon="fa-solid fa-triangle-exclamation"
        :closable="false"
      >
        {{ $t("rooms.connection_error.reconnecting") }}
      </InlineNote>
    </div>
  </div>
</template>
<script setup>
import { useAuthStore } from "../stores/auth.js";

const authStore = useAuthStore();

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  detailsInline: {
    type: Boolean,
    default: false,
  },
  hideFavorites: {
    type: Boolean,
    default: false,
  },
  hideMembership: {
    type: Boolean,
    default: false,
  },
  roomAuthToken: {
    type: Object,
    default: null,
  },
  disableReload: {
    type: Boolean,
    default: false,
  },
  bbbReason: {
    type: String,
    default: null,
  },
  bbbErrors: {
    type: String,
    default: null,
  },
});

const emit = defineEmits([
  "joinedMembership",
  "reload",
  "invalidRoomAuthToken",
  "leftMembership",
]);
</script>
