<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  enabled: {
    type: Boolean,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  dataTest: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <Tag
    v-tooltip.bottom="
      enabled
        ? $t('rooms.room_types.features.enabled', { name: label })
        : $t('rooms.room_types.features.disabled', { name: label })
    "
    class="h-8 w-8 rounded-full"
    rounded
    :severity="enabled ? 'success' : 'secondary'"
    :data-test="dataTest"
  >
    <span :class="icon" />
  </Tag>
</template>
