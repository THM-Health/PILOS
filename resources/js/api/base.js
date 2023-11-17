import axios from 'axios';
import env from '@/env';
import { useAuthStore } from '@/stores/auth';

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
   * Global error handler for unhandled errors that can occur in the application.
   *
   * Make sure that you catch possible errors caused by requests to the server (e.g. validation errors)
   * in the appropriate place in the application. This handler is only for the last instance if there
   * is something going on, that should be normally.
   *
   * @param error The occurred error
   * @param vm The vue instance
   * @param info Some additional error information
   */
  error (error, vm, info) {
    const auth = useAuthStore();

    const responseStatus = error.response !== undefined ? error.response.status : undefined;
    const errorMessage = error.response && error.response.data ? error.response.data.message : undefined;

    if (responseStatus === env.HTTP_UNAUTHORIZED) { // 401 => unauthorized, redirect and show error messages as flash!
      if (auth.isAuthenticated) {
        vm.toastInfo(vm.$t('app.flash.unauthenticated'));
        auth.setCurrentUser(null, false);
        vm.$router.replace({ name: 'login', query: { redirect: vm.$router.currentRoute.path } });
      }
    } else if (responseStatus === env.HTTP_FORBIDDEN && errorMessage === 'This action is unauthorized.') { // 403 => unauthorized, show error messages as flash!
      vm.toastError(vm.$t('app.flash.unauthorized'));
    } else if (responseStatus === env.HTTP_GUESTS_ONLY) { // 420 => only for guests, redirect to home route
      vm.toastInfo(vm.$t('app.flash.guests_only'));
      vm.$router.replace({ name: 'home' });
    } else if (responseStatus === env.HTTP_PAYLOAD_TOO_LARGE) { // 413 => payload to large
      vm.toastError(vm.$t('app.flash.too_large'));
    } else if (responseStatus === env.HTTP_TOO_MANY_REQUESTS) { // 429 => too many requests
      vm.toastError(vm.$t('app.flash.too_many_requests'));
    } else if (responseStatus === env.HTTP_SERVICE_UNAVAILABLE) { // 503 => maintenance mode
      window.location.reload();
    } else if (responseStatus !== undefined) { // Another error on server
      vm.toastError(
        errorMessage ? vm.$t('app.flash.server_error.message', { message: errorMessage }) : vm.$t('app.flash.server_error.empty_message'),
        vm.$t('app.flash.server_error.error_code', { statusCode: responseStatus })
      );
    } else {
      vm.toastError(vm.$t('app.flash.client_error'));
      console.error(`Error: ${error.toString()}\nInfo: ${info}`);
    }
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
    return this.call('locale', {
      data: { locale },
      method: 'post'
    });
  }
};
