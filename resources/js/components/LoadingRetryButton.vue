<script setup>
const props = defineProps({
  error: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["reload"]);
</script>

<template>
  <div v-if="props.error" class="w-full text-center">
    <Button
      severity="secondary"
      icon="fa-solid fa-sync"
      :label="$t('app.reload')"
      data-test="loading-retry-button"
      @click="emit('reload')"
    />
  </div>
  <i v-else class="fa-solid fa-circle-notch fa-spin text-3xl" />
</template>
