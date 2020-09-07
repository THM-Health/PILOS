import axios from 'axios';
import Vue from 'vue';

export default {
  call (path, config, loadCsrfCookie = false) {
    const promise = loadCsrfCookie ? this.getCsrfCookie() : Promise.resolve();

    return promise.then(() => {
      return axios(`/api/v1/${path}`, config);
    });
  },

  error (error, vm, info) {
    return Vue.config.errorHandler(error, vm, info);
  },

  getCsrfCookie () {
    return axios.get('/sanctum/csrf-cookie');
  },

  /**
   * Sends the passed locale to the backend so it gets persisted in the current session
   * and if the user is authenticated his locale in the database gets persisted.
   *
   * @param locale Locale that should be stored in the database
   * @returns {Promise<AxiosResponse<any>>} Resolves if successful, or rejects if the locale isn't supported by the backend
   */
  setLocale (locale) {
    return this.call('setLocale', {
      data: { locale },
      method: 'post'
    });
  }
};
