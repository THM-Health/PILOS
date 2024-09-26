<script setup>
const props = defineProps({
  errors: {
    type: Object
  }
});
</script>

<template>
  <p class="text-red-500" role="alert">
    <template v-for="(error, index) in props.errors" :key="index">
      {{ error }}
      <br v-if="index < props.errors.length - 1" />
    </template>
  </p>
</template>
