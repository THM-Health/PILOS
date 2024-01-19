<template>
  <div class="room-details">
    <!--owner name-->
    <div class="flex">
      <div class="room-details__icon">
        <i class="fa-solid fa-user" />
      </div>
      <div class="room-details__text">
        <span>{{ props.room.owner.name }}</span>
      </div>
    </div>
    <!--short description-->
    <div
      v-if="props.room.short_description && props.showDescription"
      class="flex mt-2"
    >
      <div class="room-details__icon">
        <i class="fa-solid fa-info-circle" />
      </div>
      <div class="room-details__text">
        <span style="word-break: break-word;">{{ props.room.short_description }} </span>
      </div>
    </div>
    <!--last meeting info (never started, last ran till, running since)-->
    <div class="flex mt-2">
      <div class="room-details__icon">
        <i class="fa-solid fa-clock" />
      </div>
      <div class="room-details__text">
        <span v-if="props.room.last_meeting==null"> {{ $t('rooms.index.room_component.never_started') }}</span>
        <span v-else-if="props.room.last_meeting.end!=null">{{ $t('rooms.index.room_component.last_ran_till', {date:$d(new Date(props.room.last_meeting.end),'datetimeShort')}) }}</span>
        <span v-else-if="props.room.last_meeting.end==null"> {{ $t('rooms.index.room_component.running_since', {date:$d(new Date(props.room.last_meeting.start),'datetimeShort')}) }}</span>
      </div>
    </div>
    <!--participant count -->
    <div
      v-if="props.room.last_meeting && props.room.last_meeting.usage"
      class="flex justify-content-start mt-2"
    >
      <div class="room-details__icon">
        <i class="fa-solid fa-users" />
      </div>
      <div class="room-details__text">
        <span>{{ props.room.last_meeting.usage.participant_count }} {{ $t('meetings.participant_count') }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>

import { defineProps } from 'vue';

const props = defineProps({
  room: Object,
  showDescription: {
    type: Boolean,
    default: false
  }
});

</script>
