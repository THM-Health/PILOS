import auth from '../../api/auth';
import base from '../../api/base';
import { loadLanguageAsync } from '../../i18n';
import PermissionService from '../../services/PermissionService';

const state = () => ({
  application: null,
  currentLocale: null
});

const getters = {
  isAuthenticated: state => {
    return !$.isEmptyObject(state.application) && !$.isEmptyObject(state.application.user);
  },
  settings: (state) => (setting) => {
    return $.isEmptyObject(state.application) || state.application.settings === undefined || !(setting in state.application.settings) ? null : state.application.settings[setting];
  }
};

const actions = {
  async login ({ dispatch, commit, state }, { credentials, method }) {
    await auth.login(credentials, method);
    await dispatch('getApplication');

    if (state.application.user.locale !== null) {
      await loadLanguageAsync(state.application.user.locale);
      commit('setCurrentLocale', state.application.user.locale);
    }
  },

  async getApplication ({ commit }) {
    const application = await auth.getApplication();
    commit('setApplication', application);
  },

  async logout ({ commit }) {
    commit('loading', null, { root: true });
    await auth.logout();
    commit('setUser', null);
    commit('loadingFinished', null, { root: true });
  },

  async setLocale ({ commit, dispatch }, { locale }) {
    await base.setLocale(locale);
    await dispatch('getApplication');
    commit('setCurrentLocale', locale);
  }
};

const mutations = {
  setCurrentLocale (state, currentLocale) {
    state.currentLocale = currentLocale;
  },

  setApplication (state, application) {
    state.application = application;
    PermissionService.setCurrentUser(state.application.user);
  },

  setUser (state, user) {
    state.application.user = user;
    PermissionService.setCurrentUser(state.application.user);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
