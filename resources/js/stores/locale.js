import { defineStore } from 'pinia';
import { setTimeZone, setLocale } from '../i18n';

export const useLocaleStore = defineStore('locale', {
  state: () => {
    return {
      currentLocale: null,
      timezone: null
    };
  },
  actions: {
    async setLocale (currentLocale) {
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
