<template>
  <Tag
    class="flex-shrink-1 text-break room-type-badge"
    :pt="{
        root: { style: { background: roomType.color } }
    }"
  >
    {{ roomType.description }}
  </Tag>
</template>

<script>
export default {
  name: 'RoomTypeBadge',
  props: {
    roomType: Object
  }
};
</script>
