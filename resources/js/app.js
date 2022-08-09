import { BootstrapVue } from 'bootstrap-vue';
import Vue from 'vue';
import store from './store';
import App from './views/App';
import router from './router';
import i18n from './i18n';
import FlashMessage from '@smartweb/vue-flash-message';
import Clipboard from 'v-clipboard';
import Base from './api/base';

/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */
window.axios = require('axios');
window.axios.defaults.withCredentials = true;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

Vue.use(Clipboard);
// Install BootstrapVue
Vue.use(BootstrapVue);

Vue.use(FlashMessage, {
  strategy: 'multiple'
});

// Add accessibility check tools for development
if (process.env.ENABLE_AXE && process.env.NODE_ENV === 'development') {
  const VueAxe = require('vue-axe').default;
  Vue.use(VueAxe);
}

Vue.config.errorHandler = Base.error;

export default new Vue({
  el: '#app',
  components: { App },
  router,
  store,
  i18n
});
