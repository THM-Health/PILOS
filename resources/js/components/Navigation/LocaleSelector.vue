<template>
  <Button  text type="button" @click="toggle" aria-haspopup="true" aria-controls="overlay_menu">
    <i class="fa-solid fa-language text-xl" /><span class="sr-only">{{ $t('app.select_locale') }}</span>
    <span class="fa-solid fa-caret-down ml-2" />
  </Button>
  <Menu
    ref="localeMenu"
    class="w-auto"
    :model="locales"
    :popup="true"
    @focus="() => nextTick(() => { localeMenu.focusedOptionIndex = -1; } )"
  />
</template>

<script setup>
import env from '@/env.js';
import Base from '@/api/base';
import {computed, nextTick, ref, watch} from 'vue';
import { useLocaleStore } from '@/stores/locale';
import { useLoadingStore } from '@/stores/loading';
import { useSettingsStore } from '../../stores/settings.js';

const localeStore = useLocaleStore();
const loadingStore = useLoadingStore();
const settingsStore = useSettingsStore();

const localeMenu = ref();

const toggle = (event) => {
  localeMenu.value.toggle(event);
};

const locales = computed(() => {
  const locales = settingsStore.getSetting('enabled_locales');
  if (!locales) {
    console.log('no locales');
    return [];
  }

  console.log('locales', locales);

  return Object.entries(locales).map(([locale, label]) => {
    return {
      label,
      command: () => changeLocale(locale),
      class: localeStore.currentLocale === locale ? 'p-highlight' : ''
    };
  });
});

async function changeLocale (locale) {
  loadingStore.setOverlayLoading();
  try {
    await Base.setLocale(locale);

    await localeStore.setLocale(locale);
  } catch (error) {
    if (error.response !== undefined && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      this.toastError(error.response.data.errors.locale.join(' '));
    } else {
      loadingStore.setOverlayLoadingFinished();
      Base.error(error, this.$root, error.message);
    }
  } finally {
    loadingStore.setOverlayLoadingFinished();
  }
}
</script>
