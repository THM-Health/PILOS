import { BootstrapVue } from 'bootstrap-vue';
import Vue, { createApp, h, Fragment } from '@vue/compat';
import { createPinia } from 'pinia';
import App from './views/App.vue';
import createRouter from './router';
import i18n from './i18n';
import Toast from './mixins/Toast';
import Base from './api/base';
import HideTooltip from './directives/hide-tooltip';
import axios from 'axios';

/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */
window.axios = axios;
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Install BootstrapVue
Vue.use(BootstrapVue);

Vue.mixin(Toast);

Vue.config.errorHandler = Base.error;

Vue.directive('tooltip-hide-click', HideTooltip);

const pinia = createPinia();

const router = createRouter();

let app = null;

const setupApp = (app) => {
  app.use(pinia);
  app.use(router);
  app.use(i18n);

  app.provide('$router', app.config.globalProperties.$router);
  app.provide('$route', app.config.globalProperties.$route);

  app.mount('#app');
};

if (import.meta.env.VITE_ENABLE_AXE === 'true' && import.meta.env.MODE === 'development') {
  import('vue-axe').then((VueAxe) => {
    app = createApp({
      render: () => h(Fragment, [h(App), h(VueAxe.VueAxePopup)])
    });
    app.use(VueAxe.default);
    setupApp(app);
  });
} else {
  app = createApp(App);
  setupApp(app);
}
