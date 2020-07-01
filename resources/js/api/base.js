import axios from 'axios'
import router from '../router'

export default {
  call (path, config, loadCsrfCookie = false) {
    const promise = loadCsrfCookie ? this.getCsrfCookie() : Promise.resolve()

    return promise.then(() => {
      return axios(`/api/v1/${path}`, config)
    }).catch((e) => {
      if (process.env.NODE_ENV === 'test') {
        return Promise.reject(e)
      }

      if (e.response.status === 401) { // 401 => unauthorized, redirect and show error messages as flash!
        // TODO: Add flash message, when implemented
        router.replace({ name: 'login' })
      } else if (e.response.status === 420) { // 420 => only for guests, redirect to home route
        // TODO: Add flash message, when implemented
        router.replace({ name: 'home' })
      } else if (e.response.status !== 422) { // Not 422 => validation errors should be handled by the component or view
        router.replace({ name: 'error', params: { statusCode: e.response.status, message: e.response.data.message } })
      }

      return Promise.reject(e)
    })
  },

  getCsrfCookie () {
    return axios.get('/sanctum/csrf-cookie')
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
    })
  }
}
