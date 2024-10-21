<template>
  <Avatar v-if="props.image" :image="props.image" :size="size" :shape="shape" />
  <Avatar v-else :label="avatarLabel" class="select-none" :size="size" :shape="shape" />
</template>

<script setup>

import { computed } from 'vue';

const props = defineProps({
  firstname: {
    type: String,
    default: ''
  },
  lastname: {
    type: String,
    default: ''
  },
  image: {
    type: [String, null],
    default: null
  },
  size: {
    type: [String, null],
    default: null
  },
  shape: {
    type: String,
    default: 'circle'
  }
});

const avatarLabel = computed(() => {
  if (!props.firstname || !props.lastname) { return ''; }
  return props.firstname?.toUpperCase().charAt(0) + props.lastname?.toUpperCase().charAt(0);
});

</script>

<style scoped>

</style>
