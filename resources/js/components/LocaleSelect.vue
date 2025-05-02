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
import { useI18n } from "vue-i18n";
import { useLocaleStore } from "../stores/locale.js";

const settingsStore = useSettingsStore();
const localeStore = useLocaleStore();
const { t, te } = useI18n();

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
    let localeLabel = label;
    const localeTranslationKey = "app.locales." + locale;
    if (localeStore.currentLocale !== locale && te(localeTranslationKey)) {
      const translatedLabel = t(localeTranslationKey);
      localeLabel = localeLabel + " (" + translatedLabel + ")";
    }

    availableLocales.push({
      value: locale,
      text: localeLabel,
    });
  }
  return availableLocales;
});
</script>
