<template>
  <div>
  <Select
    :inputId="props.id"
    :options="locales"
    optionLabel="text"
    optionValue="value"
    :required="props.required"
    v-model="model"
    :invalid="props.invalid"
    :disabled="props.disabled"
    :placeholder="$t('app.select_locale')"
    class="w-full"
  />
  </div>
</template>

<script setup>
import { useSettingsStore } from '../stores/settings';
import { computed } from 'vue';

const settingsStore = useSettingsStore();

const model = defineModel();

const props = defineProps({
  invalid: {
    type: Boolean,
    default: false
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

/**
 * The available locales that the user can select from.
 */
const locales = computed(() => {
  const availableLocales = [];
  for (const [locale, label] of Object.entries(settingsStore.getSetting('general.enabled_locales'))) {
    availableLocales.push({
      value: locale,
      text: label
    });
  }
  return availableLocales;
});
</script>
