import axios from 'axios';
import env from '@/env';
import { useToast } from './useToast';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

export function useApi () {
  const auth = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const { t } = i18n.global;

  return {
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
      const promise = loadCsrfCookie ? axios.get('/sanctum/csrf-cookie') : Promise.resolve();

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
     */
    error (error) {
      const responseStatus = error.response !== undefined ? error.response.status : undefined;
      const errorMessage = error.response && error.response.data ? error.response.data.message : undefined;

      if (responseStatus === env.HTTP_UNAUTHORIZED) { // 401 => unauthorized, redirect and show error messages as flash!
        if (auth.isAuthenticated) {
          toast.info(t('app.flash.unauthenticated'));
          auth.setCurrentUser(null, false);
          router.replace({ name: 'login', query: { redirect: router.currentRoute.path } });
        }
      } else if (responseStatus === env.HTTP_FORBIDDEN && errorMessage === 'This action is unauthorized.') { // 403 => unauthorized, show error messages as flash!
        toast.error(t('app.flash.unauthorized'));
      } else if (responseStatus === env.HTTP_GUESTS_ONLY) { // 420 => only for guests, redirect to home route
        toast.info(t('app.flash.guests_only'));
        router.replace({ name: 'home' });
      } else if (responseStatus === env.HTTP_PAYLOAD_TOO_LARGE) { // 413 => payload to large
        toast.error(t('app.flash.too_large'));
      } else if (responseStatus === env.HTTP_TOO_MANY_REQUESTS) { // 429 => too many requests
        toast.error(t('app.flash.too_many_requests'));
      } else if (responseStatus === env.HTTP_SERVICE_UNAVAILABLE) { // 503 => maintenance mode
        window.location.reload();
      } else if (responseStatus !== undefined) { // Another error on server
        toast.error(
          errorMessage ? t('app.flash.server_error.message', { message: errorMessage }) : t('app.flash.server_error.empty_message'),
          t('app.flash.server_error.error_code', { statusCode: responseStatus })
        );
      } else {
        toast.error(t('app.flash.client_error'));
        console.error(error);
      }
    }
  };
}
