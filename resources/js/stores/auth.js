import { defineStore } from 'pinia';
import auth from '../api/auth';
import PermissionService from '../services/PermissionService';
import _ from 'lodash';
import { useLocaleStore } from './locale';

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
      await auth.login(credentials, method);
      await this.getCurrentUser();
    },

    async getCurrentUser () {
      let currentUser = await auth.getCurrentUser();
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
      const response = await auth.logout();

      // logout successfull, clear current user
      this.setCurrentUser(null, false);
      // reset timezone of i18n to use local system timezone
      const locale = useLocaleStore();
      locale.setTimezone(undefined);

      return response;
    },

    setCurrentUser (currentUser, emit = true) {
      this.currentUser = currentUser;
      PermissionService.setCurrentUser(this.currentUser, emit);
    }
  }
});
