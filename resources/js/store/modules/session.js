import auth from '../../api/auth';
import base from '../../api/base';
import { loadLanguageAsync } from '../../i18n';
import PermissionService from '../../services/PermissionService';

const state = () => ({
  currentUser: null,
  currentLocale: null
});

const getters = {
  isAuthenticated: state => {
    return !$.isEmptyObject(state.currentUser);
  }
};

const actions = {
  async login ({ dispatch, commit, state }, { credentials, method }) {
    await auth.login(credentials, method);
    await dispatch('getCurrentUser');

    if (state.currentUser.locale !== null) {
      await loadLanguageAsync(state.currentUser.locale);
      commit('setCurrentLocale', state.currentUser.locale);
    }
  },

  async getCurrentUser ({ commit }) {
    const currentUser = await auth.getCurrentUser();
    commit('setCurrentUser', currentUser);
  },

  async logout ({ commit }) {
    commit('loading', null, { root: true });
    await auth.logout();
    commit('setCurrentUser', null);
    commit('loadingFinished', null, { root: true });
  },

  async setLocale ({ commit, dispatch }, { locale }) {
    await base.setLocale(locale);
    await dispatch('getCurrentUser');
    commit('setCurrentLocale', locale);
  }
};

const mutations = {
  setCurrentLocale (state, currentLocale) {
    state.currentLocale = currentLocale;
  },

  setCurrentUser (state, currentUser) {
    state.currentUser = currentUser;
    PermissionService.setPermissions(state.currentUser && state.currentUser.permissions ? state.currentUser.permissions : []);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
