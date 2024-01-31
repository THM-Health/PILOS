<script setup>

import { computed } from 'vue';

const props = defineProps([
  'firstname',
  'lastname',
  'image',
  'size'
]);

const avatarLabel = computed(() => {
  return props.firstname.toUpperCase().charAt(0) + props.lastname.toUpperCase().charAt(0);
});

</script>

<template>
  <Avatar v-if="props.image" :image="props.image" :size="size" shape="circle" />
  <Avatar v-else :label="avatarLabel" :size="size" shape="circle" />
</template>

<style scoped>

</style>
