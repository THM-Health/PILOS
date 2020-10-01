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
    /** Get a nested property from an object without returning any errors.
     * If the property or property chain doesn't exist, undefined is returned.
     * Property names with spaces may use either dot or bracket "[]" notation.
     * Note that bracketed property names without surrounding quotes will fail the lookup.
     *      e.g. embedded variables are not supported.
     * @param {object} obj The object to check
     * @param {string} prop The property or property chain to get (e.g. obj.prop1.prop1a or obj['prop1'].prop2)
     * @returns {*|undefined} The value of the objects property or undefined if the property doesn't exist
     */
    function getProp (obj, prop) {
      if (typeof obj !== 'object') throw new Error('getProp: obj is not an object');
      if (typeof prop !== 'string') throw new Error('getProp: prop is not a string');

      // Replace [] notation with dot notation
      prop = prop.replace(/\[["'`](.*)["'`]\]/g, '.$1');

      return prop.split('.').reduce(function (prev, curr) {
        return prev ? prev[curr] : undefined;
      }, obj || self);
    } // --- end of fn getProp() --- //

    return $.isEmptyObject(state.settings) || getProp(state.settings, setting);
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
    let currentUser = await auth.getCurrentUser();
    if ($.isEmptyObject(currentUser)) { currentUser = null; }
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
