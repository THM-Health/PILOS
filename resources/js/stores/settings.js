import { defineStore } from 'pinia';
import base from '@/api/base';
import _ from 'lodash';

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
      const response = await base.call('settings');
      this.settings = response.data.data;
    }
  }
});
