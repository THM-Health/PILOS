import { defineStore } from 'pinia';
import base from '@/api/base';
import { useAuthStore } from './auth';
import { setTimeZone, setLocale } from '../i18n';

export const useLocaleStore = defineStore('locale', {
  state: () => {
    return {
      currentLocale: null,
      timezone: null
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
      await setLocale(currentLocale);
      setTimeZone(this.timezone);
    },

    async setTimezone (timezone) {
      this.timezone = timezone;
      setTimeZone(timezone);
    }
  }
});
