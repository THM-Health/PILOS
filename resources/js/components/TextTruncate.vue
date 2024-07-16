<template>
  <div
    ref="overflow"
    v-tooltip="{ value: slotText, autoHide: false }"
    class="text-ellipsis overflow-hidden"
  >
    <slot />
  </div>
</template>

<script setup>

import { useResizeObserver } from '@vueuse/core';
import { computed, ref } from 'vue';

const overflow = ref(null);
const disabled = ref(false);

useResizeObserver(overflow, (entries) => {
  const element = entries[0].target;
  disabled.value = element.offsetWidth >= element.scrollWidth;
});

const slotText = computed(() => {
  if (disabled.value) { return null; }
  return overflow?.value?.innerText;
});
</script>
