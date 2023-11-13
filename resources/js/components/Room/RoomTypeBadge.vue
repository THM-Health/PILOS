<template>
    <b-badge class="flex-shrink-1 text-break" style="white-space: normal" :style="{ 'background-color': roomType.color }">{{ roomType.description }}</b-badge>
  </template>

<script>
export default {
  props: {
    roomType: Object
  }
};
</script>
