import Base from './base'

export default {
  login (credentials) {
    return Base.call('login', {
      method: 'post',
      data: credentials
    }, true)
  },

  getCurrentUser () {
    return Base.call('currentUser').then(response => {
      return response.data.data
    })
  }
}
