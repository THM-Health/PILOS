import auth from '../../api/auth';
import base from '../../api/base';
import { loadLanguageAsync } from '../../i18n';
import PermissionService from '../../services/PermissionService';
import _ from 'lodash';

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
    return $.isEmptyObject(state.settings) ? undefined : _.get(state.settings, setting);
  }
};

const actions = {
  async login ({ dispatch, commit, state }, { credentials, method }) {
    await auth.login(credentials, method);
    await dispatch('getCurrentUser');

    if (state.currentUser.user_locale !== null) {
      await loadLanguageAsync(state.currentUser.user_locale);
      commit('setCurrentLocale', state.currentUser.user_locale);
    }
  },

  async getSettings ({ commit }) {
    let response = await base.call('settings');
    commit('setSettings', response.data.data);
  },

  async getCurrentUser ({ commit }) {
    let currentUser = await auth.getCurrentUser();
    if ($.isEmptyObject(currentUser)) { currentUser = null; }
    commit('setCurrentUser', { currentUser });
  },

  async logout ({ commit }) {
    commit('loading', null, { root: true });
    await auth.logout();
    commit('setCurrentUser', { currentUser: null, emit: false });
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

  setCurrentUser (state, { currentUser, emit = true }) {
    state.currentUser = currentUser;
    PermissionService.setCurrentUser(state.currentUser, emit);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
