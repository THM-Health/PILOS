import { defineStore } from 'pinia';
import base from '../api/base';
import { useAuthStore } from './auth';
import { setTimeZone, loadLanguageAsync, getLocaleList } from '../i18n';

export const useLocaleStore = defineStore('locale', {
  state: () => {
    return {
      currentLocale: null,
      availableLocales: null
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
      await loadLanguageAsync(currentLocale);
    },

    async setTimezone (timezone) {
      await setTimeZone(timezone);
    },

    loadAvailableLocales () {
      this.availableLocales = getLocaleList();
    }
  }
});
