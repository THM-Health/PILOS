<template>
  <b-nav-item-dropdown
    right
    toggle-class="text-primary nav-icon-item"
  >
    <template #button-content>
      <i class="fa-solid fa-language" /><span class="sr-only">{{ $t('app.select_locale') }}</span>
    </template>
    <b-dropdown-item
      v-for="(label, locale) in locales"
      :key="locale"
      :active="locale === currentLocale"
      @click="changeLocale(locale)"
    >
      {{ label }}
    </b-dropdown-item>
  </b-nav-item-dropdown>
</template>

<script>
import { loadLanguageAsync, getLocaleList } from '../i18n';
import env from '@/env.js';
import Base from '@/api/base';
import { mapActions, mapState } from 'pinia';
import { useLocaleStore } from '@/stores/locale';
import { useLoadingStore } from '@/stores/loading';

export default {

  computed: {

    locales () {
      return getLocaleList();
    },

    ...mapState(useLocaleStore, ['currentLocale'])
  },
  methods: {
    ...mapActions(useLocaleStore, ['setLocale']),
    ...mapActions(useLoadingStore, ['setOverlayLoading', 'setOverlayLoadingFinished']),

    async changeLocale (locale) {
      this.setOverlayLoading();
      try {
        await this.setLocale(locale);
        await loadLanguageAsync(locale);
      } catch (error) {
        if (error.response !== undefined && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.toastError(error.response.data.errors.locale.join(' '));
        } else {
          this.setOverlayLoadingFinished();
          Base.error(error, this.$root, error.message);
        }
      } finally {
        this.setOverlayLoadingFinished();
      }
    }
  }
};
</script>

<style scoped>

</style>
