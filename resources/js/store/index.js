import Vue from 'vue';
import Vuex from 'vuex';
import session from './modules/session';
import { loadLanguageAsync } from '../i18n';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  modules: {
    session
  },
  strict: debug,
  plugins: [],
  actions: {
    async initialize ({ dispatch, commit }, { locale }) {
      commit('loading');
      await dispatch('session/getApplication');
      await loadLanguageAsync(locale);
      commit('session/setCurrentLocale', locale);
      commit('initialized');
      commit('loadingFinished');
    }
  },
  mutations: {
    initialized (state) {
      state.initialized = true;
    },

    /**
     * Increments the loading counter of the state.
     *
     * This mutator should only be used if data gets loaded for the entire application.
     * Make sure committing the `loadingFinished` mutator after the data was loaded.
     *
     * @param state
     */
    loading (state) {
      state.loadingCounter++;
    },

    /**
     * Decrements the loading counter of the state.
     *
     * This mutator should only be used if data was loaded for the entire application
     * and previously the `loading` mutator was committed.
     *
     * @param state
     */
    loadingFinished (state) {
      state.loadingCounter = Math.max(0, state.loadingCounter - 1);
    }
  },
  state: {
    initialized: false,

    /**
     * Counter of running data loading processes for the entire application.
     *
     * This counter can be used for a global overlay over the whole page.
     */
    loadingCounter: 0
  }
});
