<template>
  <Tag
    class="text-break room-type-badge shrink"
    style="word-break: normal; overflow-wrap: anywhere"
    :pt="{
      root: { style: { background: roomType.color } },
    }"
    data-test="room-type-badge"
  >
    {{ roomType.name }}
  </Tag>
</template>

<script setup>
defineProps({
  roomType: {
    type: Object,
    required: true,
  },
});
</script>
