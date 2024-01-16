<template>
  <div class="overlay-wrap relative">
    <slot />
      <div
        v-if="show"
        class="absolute top-0 left-0 right-0 bottom-0" style="backdrop-filter: blur(2px);"
      >
        <div class="absolute top-0 left-0 right-0 bottom-0 surface-500" style="opacity: 0.85" />

        <div class="overlay-wrapper absolute top-0 left-0 right-0 bottom-0">
          <slot name="overlay">
            <i class="fa-solid fa-circle-notch fa-spin text-white" />
          </slot>
        </div>
      </div>
    </div>
</template>
<script setup>

defineProps([
  'show',
  'zIndex'
]);

</script>
