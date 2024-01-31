<template>

  <NavbarDropdownButton>
    <template v-slot:button-content>
      <i class="fa-solid fa-language text-xl hidden lg:block" />
      <span class="block lg:hidden">{{ $t('app.select_locale') }}</span>
    </template>
    <template v-slot="slotProps">
      <NavbarDropdownItem
        v-for="locale in locales"
        :key="locale.locale"
        @click="slotProps.closeCallback(); $emit('itemClicked'); changeLocale(locale.locale)"
        :text="locale.label"
      />
    </template>
  </NavbarDropdownButton>
</template>

<script setup>
import env from '@/env.js';
import Base from '@/api/base';
import { useApi } from '@/composables/useApi';
import { computed } from 'vue';
import { useLocaleStore } from '@/stores/locale';
import { useLoadingStore } from '@/stores/loading';
import { useSettingsStore } from '@/stores/settings.js';

const localeStore = useLocaleStore();
const loadingStore = useLoadingStore();
const settingsStore = useSettingsStore();
const api = useApi();

const locales = computed(() => {
  const locales = settingsStore.getSetting('enabled_locales');
  if (!locales) {
    console.log('no locales');
    return [];
  }

  return Object.entries(locales).map(([locale, label]) => {
    return {
      label,
      locale
    };
  });
});

async function changeLocale (locale) {
  loadingStore.setOverlayLoading();
  try {
    await api.call('locale', {
      data: { locale },
      method: 'post'
    });

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
