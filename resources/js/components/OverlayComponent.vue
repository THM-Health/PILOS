<template>
  <div
    class="overlay-wrap relative"
    :style="{ 'min-height': props.show ? '3rem' : null }"
  >
    <div class="contents" :inert="show">
      <slot />
    </div>

    <div aria-live="polite" aria-atomic="true" class="sr-only">
      <span>{{ liveAnnouncement }}</span>
    </div>

    <div
      v-if="props.show"
      data-test="overlay"
      class="inset-0 backdrop-blur-xs"
      :class="fixed ? 'fixed' : 'absolute'"
      :style="{ 'z-index': props.zIndex }"
    >
      <div
        class="absolute bg-surface-100 dark:bg-surface-900"
        style="inset: 0"
        :style="{ opacity: props.opacity }"
      />

      <div class="overlay-wrapper absolute inset-0" :class="wrapperClass">
        <slot name="overlay">
          <i
            class="fa-solid fa-circle-notch fa-spin text-3xl"
            aria-hidden="true"
          />
        </slot>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  announcement: {
    type: String,
    default: "",
  },
  zIndex: {
    type: Number,
    required: false,
    default: null,
  },
  noCenter: {
    type: Boolean,
    default: false,
  },
  opacity: {
    type: Number,
    default: 0.85,
  },
  fixed: {
    type: Boolean,
    default: false,
  },
});

const liveAnnouncement = ref("");

const wrapperClass = computed(() => {
  return {
    "flex justify-center items-center": !props.noCenter,
  };
});

watch(
  () => props.announcement,
  (message, previousMessage, onCleanup) => {
    if (!message) {
      return;
    }

    const timeoutId = setTimeout(() => {
      liveAnnouncement.value = message;
    }, 100);

    onCleanup(() => {
      clearTimeout(timeoutId);
    });
  },
  { immediate: true },
);
</script>
