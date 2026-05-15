<script setup>
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["submit"]);

function onSubmit() {
  if (props.disabled) return;
  emit("submit");
}
</script>

<template>
  <form novalidate @submit.prevent="onSubmit" class="form">
    <slot></slot>
  </form>
</template>

<style scoped></style>
