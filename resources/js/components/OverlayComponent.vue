<template>
  <div class="overlay-wrap relative">
      <slot />
      <div
        v-if="props.show"
        class="absolute" style="inset: 0; backdrop-filter: blur(2px);" :style="{'z-index': props.zIndex}"
      >
        <div class="absolute" style="inset: 0; opacity: 0.85; background-color: #f8f9fa"  />

        <div class="overlay-wrapper absolute top-0 left-0 right-0 bottom-0" :class="wrapperClass">
          <slot name="overlay">
            <i class="fa-solid fa-circle-notch fa-spin text-3xl" />
          </slot>
        </div>
      </div>
    </div>
</template>
<script setup>

import { computed } from 'vue';

const props = defineProps([
  'show',
  'zIndex',
  'noCenter'
]);

const wrapperClass = computed(() => {
  return {
    'flex justify-content-center align-items-center': !props.noCenter
  };
});

</script>
