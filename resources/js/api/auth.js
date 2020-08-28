import Base from './base';

export default {
  login (credentials, method) {
    return Base.call(method === 'ldap' ? 'login/ldap' : 'login', {
      method: 'post',
      data: credentials
    }, true);
  },

  logout () {
    return Base.call('logout', {
      method: 'post'
    });
  },

  getApplication () {
    return Base.call('application').then(response => {
      return response.data.data;
    });
  }
};
