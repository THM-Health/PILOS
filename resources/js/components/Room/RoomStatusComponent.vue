<template>
  <div
    v-bind:class="{running: running}"
    v-b-tooltip.hover
    :title="running ? $t('rooms.status.running') : $t('rooms.status.notRunning')"
    class="room-status"
  >
  </div>
</template>

<script>
export default {
  name: 'RoomStatusComponent',
  props: {
    running: {
      type: Boolean,
      default: false
    }
  }
};
</script>
