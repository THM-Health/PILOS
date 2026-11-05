<script setup>
defineProps({
  severity: {
    type: String,
    default: "secondary",
  },
});
</script>

<template>
  <Message
    :severity="severity"
    class="inline-note"
    aria-live="off"
    role="presentation"
    ><slot
  /></Message>
</template>
