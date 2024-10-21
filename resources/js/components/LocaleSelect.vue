<template>
  <div>
    <Select
      v-model="model"
      :aria-labelledby="props.ariaLabelledby"
      data-test="locale-dropdown"
      :options="locales"
      option-label="text"
      option-value="value"
      :required="props.required"
      :invalid="props.invalid"
      :disabled="props.disabled"
      :placeholder="$t('app.select_locale')"
      class="w-full"
      :pt="{
        listContainer: {
          'data-test': 'locale-dropdown-items',
        },
        option: {
          'data-test': 'locale-dropdown-option',
        },
      }"
    />
  </div>
</template>

<script setup>
import { useSettingsStore } from "../stores/settings";
import { computed } from "vue";

const settingsStore = useSettingsStore();

const model = defineModel({ type: String });

const props = defineProps({
  invalid: {
    type: Boolean,
    default: false,
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
    type: String,
    required: true,
  },
});

/**
 * The available locales that the user can select from.
 */
const locales = computed(() => {
  const availableLocales = [];
  for (const [locale, label] of Object.entries(
    settingsStore.getSetting("general.enabled_locales"),
  )) {
    availableLocales.push({
      value: locale,
      text: label,
    });
  }
  return availableLocales;
});
</script>
