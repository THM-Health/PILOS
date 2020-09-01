import auth from '../../api/auth';
import base from '../../api/base';
import { loadLanguageAsync } from '../../i18n';
import PermissionService from '../../services/PermissionService';

const state = () => ({
  settings: null,
  currentUser: null,
  currentLocale: null
});

const getters = {
  isAuthenticated: state => {
    return !$.isEmptyObject(state.currentUser);
  },
  settings: (state) => (setting) => {
    return $.isEmptyObject(state.settings) || !(setting in state.settings) ? null : state.settings[setting];
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

  async getSettings ({ commit }) {
    base.call('settings').then(response => {
      return commit('setSettings', response.data.data);
    });
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

  setSettings (state, settings) {
    state.settings = settings;
  },

  setCurrentUser (state, currentUser) {
    state.currentUser = currentUser;
    PermissionService.setCurrentUser(state.currentUser);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
