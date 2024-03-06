<template>
  <label
    :for="inputId"
    class="flex-shrink-0 p-button p-component"
    :class="{'p-disabled': disabled}"
    tabindex="0"
    @keyup.enter="fileInputRef.click()"
    @keyup.space="fileInputRef.click()"
  >
    <i class="fa-solid fa-upload mr-2"></i> {{ model?.name ?? $t('app.browse') }}
  </label>
  <input
    type="file"
    ref="fileInputRef"
    :id="inputId"
    class="hidden"
    :disabled="disabled"
    @input="fileSelected"
    :accept="accept"
  />
</template>

<script setup>

import { computed, onMounted, ref, watch } from 'vue';
import _ from 'lodash';

const fileInputRef = ref();

const inputId = ref();

onMounted(() => {
  inputId.value = _.uniqueId('file-input-');
});

const accept = computed(() => {
  if (!props.allowedExtensions) { return ''; }
  return '.' + props.allowedExtensions.join(',.');
});

const model = defineModel();
const tooBig = defineModel('tooBig');
const invalidExtension = defineModel('invalidExtension');

const props = defineProps({
  maxFileSize: {
    type: Number
  },
  allowedExtensions: {
    type: Array
  },
  disabled: {
    type: Boolean,
    default: false
  },
  invalid: {
    type: Boolean,
    default: false
  }
});

watch(() => model.value, (value) => {
  if (value) {
    tooBig.value = !!(props.maxFileSize && value.size > props.maxFileSize);

    invalidExtension.value = !!(props.allowedExtensions && !props.allowedExtensions.includes(value.name.split('.').pop()));
  } else {
    invalidExtension.value = false;
    tooBig.value = false;
  }
});

function fileSelected (event) {
  model.value = event.target.files[0];
}

</script>
