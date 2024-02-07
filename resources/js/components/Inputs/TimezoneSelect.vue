<template>
  <InputGroup>
    <Dropdown
      :id="props.id"
      :model-value="props.modelValue"
      class="w-full"
      :options="timezones"
      :required="props.required"
      :invalid="props.invalid"
      :disabled="disabled || loading || loadingError"
      @update:modelValue="input"
      :placeholder="props.placeholder"
      :class="{'p-invalid': props.invalid}"
    >
    </Dropdown>
      <Button
        v-if="loadingError"
        :disabled="loading"
        severity="secondary"
        outlined
        @click="loadTimezones()"
        icon="fa-solid fa-sync"
      />
  </InputGroup>
</template>

<script setup>
import { useApi } from '@/composables/useApi.js';
import {onMounted, ref, watch} from "vue";
const api = useApi();

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  placeholder: {
    type: String,
    required: false
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
  },
  invalid: Boolean
});

const timezones = ref([]);
const loading = ref(false);
const loadingError = ref(false);

const emit = defineEmits(['update:modelValue', 'loadingError']);

// detect changes of the model loading error
watch(loadingError, (value) =>{
  emit('loadingError', value);
});

// detect busy status while data fetching and notify parent
watch(loading, (value) =>{
  emit('busy', value);
});

onMounted(()=>{
  loadTimezones();
});

/**
 * Loads the possible selectable timezones.
 */
function loadTimezones(){
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

/**
 * Emits the input event.
 *
 * @param {string} value
 */
function input(value){
  emit('update:modelValue', value);
}

</script>
