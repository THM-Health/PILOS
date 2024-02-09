<script setup>
const props = defineProps({
  error: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['reload']);

</script>

<template>
  <div v-if="props.error" class="w-full text-center">
    <Button
      @click="emit('reload')"
      severity="secondary"
      icon="fa-solid fa-sync"
      :label="$t('app.reload')"
    />
  </div>
  <i v-else class="fa-solid fa-circle-notch fa-spin text-3xl" />
</template>
