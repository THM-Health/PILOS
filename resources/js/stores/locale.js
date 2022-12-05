import { defineStore } from 'pinia';
import base from '../api/base';
import { useAuthStore } from './auth';

export const useLocaleStore = defineStore('locale', {
  state: () => {
    return {
      currentLocale: null
    };
  },
  actions: {
    async setLocale (locale) {
      await base.setLocale(locale);

      const auth = useAuthStore();
      await auth.getCurrentUser();

      this.setCurrentLocale(locale);
    },

    setCurrentLocale (currentLocale) {
      this.currentLocale = currentLocale;
    }
  }
});
