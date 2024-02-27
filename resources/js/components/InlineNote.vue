<script setup>

defineProps({
  severity: {
    type: String,
    default: 'info'
  }
});
</script>

<template>
  <InlineMessage :severity="severity" aria-live="off" role="presentation"><slot /></InlineMessage>
</template>
