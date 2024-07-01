<script setup>

defineProps({
  severity: {
    type: String,
    default: 'info'
  }
});
</script>

<template>
  <Message :severity="severity" aria-live="off" role="presentation"><slot /></Message>
</template>
