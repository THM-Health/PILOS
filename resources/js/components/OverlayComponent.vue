<template>
  <div class="overlay-wrap relative" :style="{'min-height': props.show ? '3rem' : null}">
      <slot />
      <div
        v-if="props.show"
        class="absolute" style="inset: 0; backdrop-filter: blur(2px);" :style="{'z-index': props.zIndex}"
      >
        <div class="absolute" style="inset: 0; background-color: #f8f9fa" :style="{opacity: props.opacity}" />

        <div class="overlay-wrapper absolute top-0 left-0 right-0 bottom-0" :class="wrapperClass" >
          <slot name="overlay">
            <i class="fa-solid fa-circle-notch fa-spin text-3xl" />
          </slot>
        </div>
      </div>
    </div>
</template>
<script setup>

import { computed } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  zIndex: {
    type: Number,
    required: false
  },
  noCenter: {
    type: Boolean,
    default: false
  },
  opacity: {
    type: Number,
    default: 0.85
  }
});

const wrapperClass = computed(() => {
  return {
    'flex justify-center items-center': !props.noCenter
  };
});

</script>
