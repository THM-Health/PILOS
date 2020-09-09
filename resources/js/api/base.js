import axios from 'axios';
import Vue from 'vue';

export default {
  /**
   * Makes a request with the passed params.
   *
   * If `loadCsrfCookie` is set to true before the request a csrf cookie will be requested.
   *
   * @param path Path that should be called. The api slug will be automatically added.
   * @param config Config object as it is passed to the axios function.
   * @param loadCsrfCookie Boolean, that indicates whether a csrf cookie should be requested or not.
   * @return {Promise<AxiosResponse<any>>} Promise that resolves to a axios response or rejects on errors.
   */
  call (path, config, loadCsrfCookie = false) {
    const promise = loadCsrfCookie ? this.getCsrfCookie() : Promise.resolve();

    return promise.then(() => {
      return axios(`/api/v1/${path}`, config);
    });
  },

  /**
   * Calls the vue global error handler with the passed params.
   *
   * @see Vue.config.errorHandler
   */
  error (error, vm, info) {
    return Vue.config.errorHandler(error, vm, info);
  },

  /**
   * Loads the csrf cookie from the backend.
   *
   * @return {Promise<AxiosResponse<any>>} Promise that resolves to a axios response or rejects on errors.
   */
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
