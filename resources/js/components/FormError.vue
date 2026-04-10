<script setup>
const props = defineProps({
  errors: {
    type: [Object, null],
    required: true,
    default: null,
  },
});
</script>

<template>
  <p
    v-if="props.errors != null && Object.keys(props.errors).length > 0"
    class="form-error text-red-500"
    role="alert"
  >
    <template v-for="(error, index) in props.errors" :key="index">
      {{ error }}
      <br v-if="index < props.errors.length - 1" />
    </template>
  </p>
</template>
