<template>
  <Tag
    class="flex-shrink-1 text-break"
    style="white-space: normal"
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
