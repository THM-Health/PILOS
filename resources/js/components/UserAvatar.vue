<script setup>

import { computed } from 'vue';

const props = defineProps({
  firstname: {
    type: String
  },
  lastname: {
    type: String
  },
  image: {
    type: String
  },
  size: {
    type: String
  },
  shape: {
    type: String,
    default: 'circle'
  }
});

const avatarLabel = computed(() => {
  return props.firstname?.toUpperCase().charAt(0) + props.lastname?.toUpperCase().charAt(0);
});

</script>

<template>
  <Avatar v-if="props.image" :image="props.image" :size="size" :shape="shape" />
  <Avatar v-else :label="avatarLabel" :size="size" :shape="shape" />
</template>

<style scoped>

</style>
