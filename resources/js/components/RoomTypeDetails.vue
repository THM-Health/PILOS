<script setup>

import { computed } from 'vue';

const props = defineProps({
  roomType: {
    type: Object,
    required: true
  },
  iconsOnly: {
    type: Boolean,
    default: false
  }
});

const hasRestrictions = computed(() => {
  return !props.roomType.allow_listing ||
          !props.roomType.allow_record_attendance ||
          props.roomType.require_access_code ||
          props.roomType.max_participants ||
          props.roomType.max_duration;
});

</script>

<template>
  <div class="flex flex-column gap-2 w-full">
      <RoomTypeBadge :roomType="roomType" class="w-full text-base" />

      <div class="flex flex-column gap-2 border-1 border-200 border-round p-3">
        <span class="font-bold">{{ $t('rooms.room_types.restrictions.title') }}</span>

        <i v-if="!hasRestrictions">{{ $t('rooms.room_types.restrictions.none') }}</i>

        <div v-if="!roomType.allow_listing" class="flex align-items-start gap-2">
          <i class="fa-solid fa-magnifying-glass"></i>
          <span>{{ $t('rooms.room_types.restrictions.no_listing') }}</span>
        </div>

        <div v-if="!roomType.allow_record_attendance" class="flex align-items-start gap-2">
          <i class="fa-solid fa-list-check"></i>
          <span>{{ $t('rooms.room_types.restrictions.no_attendace_recording') }}</span>
        </div>

        <div v-if="roomType.require_access_code" class="flex align-items-start gap-2">
          <i class="fa-solid fa-lock"></i>
          <span>{{ $t('rooms.room_types.restrictions.require_access_code') }}</span>
        </div>

        <div v-if="roomType.max_participants" class="flex align-items-start gap-2">
          <i class="fa-solid fa-users"></i>
          <span>{{ $t('rooms.room_types.restrictions.max_participants', {participants: roomType.max_participants}) }}</span>
        </div>

        <div v-if="roomType.max_duration" class="flex align-items-start gap-2">
          <i class="fa-solid fa-clock"></i>
          <span>{{ $t('rooms.room_types.restrictions.max_duration', {duration: roomType.max_duration}) }}</span>
        </div>
      </div>

  </div>
</template>

<style scoped>

</style>
