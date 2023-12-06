import { defineStore } from 'pinia';
import auth from '@/api/auth';
import { loadLanguageAsync, setTimeZone } from '@/i18n';
import PermissionService from '@/services/PermissionService';
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

      if (this.currentUser.user_locale !== null) {
        await loadLanguageAsync(this.currentUser.user_locale);

        const locale = useLocaleStore();
        locale.setCurrentLocale(this.currentUser.user_locale);
      }
    },

    async getCurrentUser () {
      let currentUser = await auth.getCurrentUser();
      if (_.isEmpty(currentUser)) {
        currentUser = null;
      }
      // set timezone of i18n, if user not logged in use undefined to set timezone to local system timezone
      setTimeZone(currentUser == null ? undefined : currentUser.timezone);

      this.setCurrentUser(currentUser);
    },

    async logout () {
      const response = await auth.logout();

      // logout successfull, clear current user
      this.setCurrentUser(null, false);
      // reset timezone of i18n to use local system timezone
      setTimeZone(undefined);

      return response;
    },

    setCurrentUser (currentUser, emit = true) {
      this.currentUser = currentUser;
      PermissionService.setCurrentUser(this.currentUser, emit);
    }
  }
});
