import { defineStore } from 'pinia';
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
    async setLocale (currentLocale) {
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
