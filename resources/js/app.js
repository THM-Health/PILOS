import { createApp, h, Fragment } from 'vue';
import { createPinia } from 'pinia';
import App from './components/App.vue';
import createRouter from './router';
import i18n from './i18n';
import axios from 'axios';
import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';
import StyleClass from 'primevue/styleclass';
import Toast from './plugins/toast';
import { useToast } from './composables/useToast';

/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */
window.axios = axios;
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const pinia = createPinia();
const router = createRouter();
const toast = useToast();
const { t } = i18n.global;

let app = null;

const setupApp = (app) => {
  app.use(pinia);
  app.use(router);
  app.use(i18n);
  app.use(PrimeVue);
  app.directive('tooltip', Tooltip);
  app.directive('styleclass', StyleClass);
  app.use(Toast);

  app.config.errorHandler = (err, vm, info) => {
    toast.error(t('app.flash.client_error'));
    console.error(err);
  };

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
