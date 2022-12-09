import { BootstrapVue } from 'bootstrap-vue';
import Vue from 'vue';
import { createPinia, PiniaVuePlugin } from 'pinia';
import App from './views/App.vue';
import createRouter from './router';
import i18n from './i18n';
import VueFlashMessage from '@smartweb/vue-flash-message/build/vue-flash-msg.umd.js';
import FlashMessage from './plugins/FlashMessage';
import VueClipboard from 'vue-clipboard2';
import Base from './api/base';
import HideTooltip from './directives/hide-tooltip';
import axios from 'axios';
import VueRouter from 'vue-router';

/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */
window.axios = axios;
window.axios.defaults.withCredentials = true;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

Vue.use(VueClipboard);
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
  const VueAxe = await import('vue-axe');
  Vue.use(VueAxe.default);
}

Vue.config.errorHandler = Base.error;

Vue.directive('tooltip-hide-click', HideTooltip);

Vue.use(PiniaVuePlugin);
const pinia = createPinia();

Vue.use(VueRouter);
const router = createRouter();

export default new Vue({
  el: '#app',
  components: { App },
  pinia,
  router,
  i18n
});
