import { defineStore } from 'pinia';
import _ from 'lodash';
import { useApi } from '../composables/useApi.js';
import { setToastLifetime } from '../composables/useToast';

export const useSettingsStore = defineStore('settings', {
  state: () => {
    return {
      settings: null
    };
  },
  getters: {
    getSetting: (state) => {
      return (setting) => _.isEmpty(state.settings) ? undefined : _.get(state.settings, setting);
    }
  },
  actions: {
    async getSettings () {
      const api = useApi();

      const response = await api.call('config');
      this.settings = response.data.data;

      setToastLifetime(this.settings.general.toast_lifetime);
    }
  }
});
