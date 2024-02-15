<template>
  <InputGroup class="w-full">
    <Dropdown
      :inputId="props.id"
      :options="timezones"
      :required="props.required"
      v-model="model"
      :invalid="props.invalid"
      :disabled="props.disabled || loadingError"
      :placeholder="props.placeholder"
      :loading="loading"
    />
    <Button
      v-if="loadingError"
      :disabled="loading"
      variant="outline-secondary"
      @click="loadTimezones()"
      icon="fa-solid fa-sync"
    />
  </InputGroup>
</template>

<script setup>

import { onMounted, ref, watch, defineModel } from 'vue';
import { useApi } from '../../composables/useApi.js';

const model = defineModel();

const props = defineProps({
  placeholder: {
    type: String,
    required: false
  },
  invalid: {
    type: Boolean,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  id: {
    type: String,
    default: 'locale'
  }
});

const emit = defineEmits('loadingError', 'busy');

const timezones = ref([]);
const loading = ref(false);
const loadingError = ref(false);

const api = useApi();

// detect changes of the model loading error
watch(loadingError, () => {
  emit('loadingError', loadingError.value);
});

// detect busy status while data fetching and notify parent
watch(loading, () => {
  emit('busy', loading.value);
});

onMounted(() => {
  loadTimezones();
});

/**
     * Loads the possible selectable timezones.
     */
function loadTimezones () {
  loading.value = true;

  api.call('getTimezones').then(response => {
    timezones.value = response.data.data;
    loadingError.value = false;
  }).catch(error => {
    loadingError.value = true;
    api.error(error);
  }).finally(() => {
    loading.value = false;
  });
}
</script>
