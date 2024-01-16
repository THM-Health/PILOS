import { useApi } from '../composables/useApi.js';
const api = useApi();

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
    console.warn('DEPRECATED: Use useApi instead');
    return api.call(path, config, loadCsrfCookie);
  },

  /**
   * Global error handler for unhandled errors that can occur in the application.
   *
   * Make sure that you catch possible errors caused by requests to the server (e.g. validation errors)
   * in the appropriate place in the application. This handler is only for the last instance if there
   * is something going on, that should be normally.
   *
   * @param error The occurred error
   * @param vm Instance of the vue component where the error occurred
   * @param info Some additional error information
   */
  error (error, vm, info) {
    console.warn('DEPRECATED: Use useApi instead');
    api.error(error);
  }
};
