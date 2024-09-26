import { defineStore } from 'pinia';
import _ from 'lodash';
import { useLocaleStore } from './locale';
import { useApi } from '../composables/useApi';

export const useAuthStore = defineStore('auth', {
  state: () => {
    return {
      currentUser: null
    };
  },
  getters: {
    isAuthenticated: (state) => !_.isEmpty(state.currentUser)
  },
  actions: {
    login: async function (credentials, method) {
      const api = useApi();

      await api.call('login/' + method, {
        method: 'post',
        data: credentials
      }, true);

      await this.getCurrentUser();
    },

    async getCurrentUser () {
      const api = useApi();

      let currentUser = await api.call('currentUser').then(response => {
        return response.data.data;
      });
      if (_.isEmpty(currentUser)) {
        currentUser = null;
      }

      const locale = useLocaleStore();

      // set timezone of i18n, if user logged in use the timezone of the user, otherwise use local system timezone
      locale.setTimezone(currentUser != null ? currentUser.timezone : undefined);

      // set locale of i18n, if user is logged in and has a locale set use this locale, otherwise use the locale of the html tag
      await locale.setLocale((currentUser != null && currentUser.user_locale != null) ? currentUser.user_locale : document.documentElement.lang);

      this.setCurrentUser(currentUser);
    },

    async logout () {
      const api = useApi();

      const response = await api.call('logout', {
        method: 'post'
      });

      // logout successfull, clear current user
      this.setCurrentUser(null, false);
      // reset timezone of i18n to use local system timezone
      const locale = useLocaleStore();
      locale.setTimezone(undefined);

      return response;
    },

    setCurrentUser (currentUser, emit = true) {
      this.currentUser = currentUser;
    }
  }
});
