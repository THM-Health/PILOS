<template>
  <span
    aria-hidden="true"
    class="inline-flex !h-[1em] !w-[1.25em] items-center justify-center leading-none"
  >
    <span
      class="inline-flex size-[1em] items-center justify-center rounded-full border-[0.1em] border-current"
    >
      <i class="fa-solid text-[0.5em]" :class="`fa-${number}`" />
    </span>
  </span>
</template>

<script setup>
defineProps({
  number: {
    type: Number,
    required: true,
  },
});
</script>
