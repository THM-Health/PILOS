<template>
  <InputGroup class="w-full">
    <Select
      v-model="model"
      data-test="timezone-dropdown"
      :aria-labelledby="props.ariaLabelledby"
      :options="timezones"
      :required="props.required"
      :invalid="props.invalid"
      :disabled="props.disabled || loading || loadingError"
      :placeholder="props.placeholder"
      :loading="loading"
      :pt="{
        listContainer: {
          'data-test': 'timezone-dropdown-items',
        },
        option: {
          'data-test': 'timezone-dropdown-option',
        },
      }"
    />
    <Button
      v-if="loadingError"
      :disabled="loading"
      outlined
      severity="secondary"
      icon="fa-solid fa-sync"
      data-test="timezone-reload-button"
      @click="loadTimezones()"
    />
  </InputGroup>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { useApi } from "../composables/useApi.js";

const model = defineModel({ type: String });

const props = defineProps({
  placeholder: {
    type: [String, null],
    default: null,
  },
  invalid: {
    type: Boolean,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  ariaLabelledby: {
    type: [String, null],
    default: null,
  },
});

const emit = defineEmits(["loadingError", "busy"]);

const timezones = ref([]);
const loading = ref(false);
const loadingError = ref(false);

const api = useApi();

// detect changes of the model loading error
watch(loadingError, () => {
  emit("loadingError", loadingError.value);
});

// detect busy status while data fetching and notify parent
watch(loading, () => {
  emit("busy", loading.value);
});

onMounted(() => {
  loadTimezones();
});

/**
 * Loads the possible selectable timezones.
 */
function loadTimezones() {
  loading.value = true;

  api
    .call("getTimezones")
    .then((response) => {
      timezones.value = response.data.data;
      loadingError.value = false;
    })
    .catch((error) => {
      loadingError.value = true;
      api.error(error);
    })
    .finally(() => {
      loading.value = false;
    });
}
</script>
