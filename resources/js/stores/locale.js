import { defineStore } from 'pinia';
import base from '../api/base';
import { useAuthStore } from './auth';
import { loadLanguageAsync } from '../i18n';
import { useI18n } from 'vue-i18n';

export const useLocaleStore = defineStore('locale', {
  state: () => {
    return {
      currentLocale: null,
      i18n: useI18n({ useScope: 'global' })
    };
  },
  actions: {
    async setLocale (locale) {
      await base.setLocale(locale);

      const auth = useAuthStore();
      await auth.getCurrentUser();

      await this.setCurrentLocale(locale);
    },

    async setCurrentLocale (currentLocale) {
      this.currentLocale = currentLocale;
      await loadLanguageAsync(this.i18n, currentLocale);
    }
  }
});
