<template>
  <Button
    :loading="loading"
    :disabled="false"
    :aria-disabled="loading"
    @click="onClick"
  >
    <SpinnerIcon
      v-if="loading"
      class="p-button-loading-icon p-button-icon p-button-icon-left"
      spin
    />
    <span
      v-else-if="icon"
      class="p-button-icon p-button-icon-left"
      :class="icon"
    ></span>
    <span v-if="label" class="p-button-label">{{ label }}</span>
    <span class="sr-only" aria-live="assertive">{{ loadingLabel }}</span>
  </Button>
</template>
<script setup>
import { computed } from "vue";
import SpinnerIcon from "@primevue/icons/spinner";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  label: {
    type: [String, null],
    default: null,
  },
  icon: {
    type: [String, null],
    default: null,
  },
  ariaLoadingLabel: {
    type: [String, null],
    default: null,
  },
});

function onClick(event) {
  if (props.loading) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}

const loadingLabel = computed(() => {
  if (props.loading) {
    return props.ariaLoadingLabel ?? t("app.loading");
  }

  return "";
});
</script>
