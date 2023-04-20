import Base from './base';

export default {
  login (credentials, method) {
    return Base.call('login/' + method, {
      method: 'post',
      data: credentials
    }, true);
  },

  logout () {
    return Base.call('logout', {
      method: 'post'
    });
  },

  getCurrentUser () {
    return Base.call('currentUser').then(response => {
      return response.data.data;
    });
  }
};
