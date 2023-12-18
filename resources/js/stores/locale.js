import { defineStore } from 'pinia';
import base from '../api/base';
import { useAuthStore } from './auth';
import i18n, { setTimeZone, setLocale } from '../i18n';

export const useLocaleStore = defineStore('locale', {
  state: () => {
    return {
      currentLocale: null,
      timezone: null,
      i18n: i18n.global
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
      await setLocale(this.i18n, currentLocale);
      setTimeZone(this.i18n, this.timezone);
    },

    async setTimezone (timezone) {
      this.timezone = timezone;
      setTimeZone(this.i18n, timezone);
    }
  }
});
