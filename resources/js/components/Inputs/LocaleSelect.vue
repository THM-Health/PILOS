<template>
  <Dropdown
    :id="props.id"
    :model-value="props.modelValue"
    :required="props.required"
    :disabled="props.disabled"
    :options="locales"
    option-value="value"
    option-label="text"
    :placeholder="$t('app.select_locale')"
    @update:modelValue="input"
    :class="{'p-invalid': props.invalid}"

  >
  </Dropdown>
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings';
import {computed} from "vue";

const settingsStore = useSettingsStore();

const props = defineProps({
  modelValue: Object,
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

const emit = defineEmits(['update:modelValue']);

/**
 * The available locales that the user can select from.
 */
const locales = computed(()=>{
  const locales = [];
  for (const [locale, label] of Object.entries(settingsStore.getSetting('enabled_locales'))) {
    locales.push({
      value: locale,
      text: label
    });
  }
  return locales;
});

/**
 * Emits the input event.
 *
 * @param {string} value
 */
function input(value){
  emit('update:modelValue', value);
}

</script>
