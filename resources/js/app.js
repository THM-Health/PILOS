import { BootstrapVue } from 'bootstrap-vue';
import Vue from 'vue';
import store from './store';
import App from './views/App.vue';
import router from './router';
import i18n from './i18n';
import VueFlashMessage from '@smartweb/vue-flash-message';
import FlashMessage from './plugins/FlashMessage';
import Clipboard from 'v-clipboard';
import Base from './api/base';
import HideTooltip from './directives/hide-tooltip';
import axios from 'axios';

/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */
window.axios = axios;
window.axios.defaults.withCredentials = true;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

Vue.use(Clipboard);
// Install BootstrapVue
Vue.use(BootstrapVue);

Vue.use(VueFlashMessage, {
  name: 'vueFlashMessage',
  strategy: 'multiple'
});
Vue.use(FlashMessage, {
  name: 'flashMessage',
  vueFlashMessageName: 'vueFlashMessage'
});

// Add accessibility check tools for development
if (import.meta.env.VITE_ENABLE_AXE && import.meta.env.MODE === 'development') {
  const VueAxe = require('vue-axe').default;
  Vue.use(VueAxe);
}

Vue.config.errorHandler = Base.error;

Vue.directive('tooltip-hide-click', HideTooltip);

export default new Vue({
  el: '#app',
  components: { App },
  router,
  store,
  i18n
});
