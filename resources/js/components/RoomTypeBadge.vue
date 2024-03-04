<template>
  <Tag
    class="flex-shrink-1 text-break room-type-badge"
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
