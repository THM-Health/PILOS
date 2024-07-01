import { createApp, h, Fragment } from 'vue';
import { createPinia } from 'pinia';
import App from './components/App.vue';
import createRouter from './router';
import i18n from './i18n';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import Tooltip from 'primevue/tooltip';
import StyleClass from 'primevue/styleclass';
import ConfirmationService from 'primevue/confirmationservice';
import Toast from './plugins/toast';
import { useToast } from './composables/useToast';

const pinia = createPinia();
const router = createRouter();
const toast = useToast();
const { t } = i18n.global;

let app = null;

const setupApp = (app) => {
  const nonce = document.querySelector('meta[name="csp-nonce"]').content;

  app.use(pinia);
  app.use(router);
  app.use(i18n);
  app.use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        cssLayer: {
          name: 'primevue',
          order: 'tailwind-base, primevue, tailwind-utilities'
        }
      },
    },
    csp: {
      nonce
    }
  });
  app.directive('tooltip', Tooltip);
  app.directive('styleclass', StyleClass);
  app.use(ConfirmationService);
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
