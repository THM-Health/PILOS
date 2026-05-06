<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";

const props = defineProps({
  errors: {
    type: [Object, null],
    required: true,
    default: null,
  },
});

const formError = ref(null);

const hasError = computed(() => {
  return props.errors != null && Object.keys(props.errors).length > 0;
});

async function scrollToFirstError() {
  await nextTick();

  const selfDomElement = formError.value;
  const firstDomElement = document.getElementsByClassName("form-error")[0];

  // Only scroll into view, if this form error is the first form error rendered on the page
  if (selfDomElement != null && selfDomElement === firstDomElement) {
    selfDomElement.scrollIntoView({ behavior: "smooth", block: "center" });
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
  <p
    v-if="hasError"
    ref="formError"
    class="form-error text-red-500"
    role="alert"
  >
    <template v-for="(error, index) in props.errors" :key="index">
      {{ error }}
      <br v-if="index < props.errors.length - 1" />
    </template>
  </p>
</template>
