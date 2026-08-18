<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { isElementInViewport } from "../utils/viewport";

const props = defineProps({
  errors: {
    type: [Array, null],
    required: true,
  },
});

const formError = ref(null);

const hasError = computed(() => {
  return props.errors != null && props.errors.length > 0;
});

async function scrollToFirstError() {
  await nextTick();

  const selfDomElement = formError.value;

  if (selfDomElement == null) {
    return;
  }

  const formElement = selfDomElement.closest(".form");
  if (formElement == null) {
    return;
  }

  const firstErrorInForm = formElement.getElementsByClassName("form-error")[0];

  // Only scroll into view, if this form error is the first form error rendered on the page
  if (selfDomElement != null && selfDomElement === firstErrorInForm) {
    // Scroll to error if not already in viewport
    if (!isElementInViewport(selfDomElement)) {
      selfDomElement.scrollIntoView({ behavior: "auto", block: "center" });
    }

    // Focus on error container for better accessibility
    selfDomElement.focus();
  }
}

// Scroll to error if errors visible state changes
watch(hasError, async () => {
  await scrollToFirstError();
});

// Scroll to error if the component is mounted with errors present
onMounted(async () => {
  if (hasError.value) {
    await scrollToFirstError();
  }
});
</script>

<template>
  <div
    v-if="hasError"
    ref="formError"
    tabindex="-1"
    class="form-error mt-2 flex flex-col font-semibold text-red-500 dark:text-red-300"
    role="alert"
  >
    <div
      v-for="(error, index) in props.errors"
      :key="index"
      class="flex items-baseline gap-1"
    >
      <i
        class="fas fa-exclamation-circle shrink-0 grow-0"
        aria-hidden="true"
      ></i>
      <span>{{ error }}</span>
    </div>
  </div>
</template>
