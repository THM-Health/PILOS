<template>
  <Tag
    class="shrink text-break room-type-badge"
    style="word-break: normal; overflow-wrap: anywhere;"
    :pt="{
        root: { style: { background: roomType.color } }
    }"
  >
    {{ roomType.name }}
  </Tag>
</template>

<script setup>

defineProps({
  roomType: {
    type: Object,
    required: true
  }
});
</script>
