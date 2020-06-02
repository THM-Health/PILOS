import axios from 'axios'

export default {
  call (path, config, loadCsrfCookie = false) {
    const promise = loadCsrfCookie ? this.getCsrfCookie() : Promise.resolve()

    // TODO: Error Handling!
    return promise.then(() => {
      return axios(`api/v1/${path}`, config)
    })
  },

  getCsrfCookie () {
    return axios.get('/sanctum/csrf-cookie')
  }
}
