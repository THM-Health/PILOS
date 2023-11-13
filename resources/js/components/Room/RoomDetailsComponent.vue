<template>
  <div class="room-details">
    <!--owner name-->
    <div class="d-flex">
      <div class="room-details__icon">
        <i class="fa-solid fa-user"></i>
      </div>
      <div class="room-details__text">
        {{ room.owner.name }}
      </div>
    </div>
    <!--short description-->
    <div class="d-flex" v-if="room.short_description && showDescription">
      <div class="room-details__icon">
        <i class="fa-solid fa-info-circle"></i>
      </div>
      <div class="room-details__text">
        <p style="word-break: break-word;" class="mb-0">{{ room.short_description }} </p>
      </div>
    </div>
    <!--last meeting info (never started, last ran till, running since)-->
    <div class="d-flex">
      <div class="room-details__icon">
        <i class="fa-solid fa-clock"></i>
      </div>
      <div class="room-details__text">
        <span v-if="room.last_meeting==null"> {{$t('rooms.index.room_component.never_started')}}</span>
        <span v-else-if="room.last_meeting.end!=null">{{$t('rooms.index.room_component.last_ran_till', {date:$d(new Date(room.last_meeting.end),'datetimeShort')})}}</span>
        <span v-else-if="room.last_meeting.end==null"> {{$t('rooms.index.room_component.running_since', {date:$d(new Date(room.last_meeting.start),'datetimeShort')})}}</span>
      </div>
    </div>
    <!--participant count -->
    <div class="d-flex justify-content-start" v-if="room.last_meeting && room.last_meeting.usage">
      <div class="room-details__icon">
        <i class="fa-solid fa-users"></i>
      </div>
      <div class="room-details__text">
        {{ room.last_meeting.usage.participant_count }} {{ $t('meetings.participant_count') }}
      </div>
    </div>
  </div>

</template>
<script>

export default {
  props: {
    room: Object,
    showDescription: {
      type: Boolean,
      default: false
    }
  }
};
</script>
