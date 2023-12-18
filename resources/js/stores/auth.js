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
      // set timezone of i18n, if user not logged in use undefined to set timezone to local system timezone
      const locale = useLocaleStore();
      locale.setTimezone(currentUser == null ? undefined : currentUser.timezone);

      if (currentUser != null && currentUser.user_locale != null) {
        await locale.setCurrentLocale(currentUser.user_locale);
      }

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
