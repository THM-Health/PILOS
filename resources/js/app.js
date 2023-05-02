import { BootstrapVue } from 'bootstrap-vue';
import Vue from 'vue';
import { createPinia, PiniaVuePlugin } from 'pinia';
import App from './views/App.vue';
import createRouter from './router';
import i18n from './i18n';
import Toast from './mixins/Toast';
import VueClipboard from 'vue-clipboard2';
import Base from './api/base';
import HideTooltip from './directives/hide-tooltip';
import axios from 'axios';
import VueRouter from 'vue-router';
import * as Sentry from '@sentry/vue';

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

Vue.mixin(Toast);

// Add accessibility check tools for development
if (import.meta.env.VITE_ENABLE_AXE === 'true' && import.meta.env.MODE === 'development') {
  import('vue-axe').then(({ default: VueAxe }) => Vue.use(VueAxe));
}

Vue.config.errorHandler = Base.error;

Vue.directive('tooltip-hide-click', HideTooltip);

Vue.use(PiniaVuePlugin);
const pinia = createPinia();

Vue.use(VueRouter);
const router = createRouter();

// Add sentry error tracking
if (import.meta.env.VITE_SENTRY_DSN_PUBLIC) {
  console.log('Sentry enabled');
  console.log(import.meta.env.VITE_SENTRY_DSN_PUBLIC);
  Sentry.init({
    Vue,
    dsn: import.meta.env.VITE_SENTRY_DSN_PUBLIC,
      // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 1.0,
    // If the entire session is not sampled, use the below sample rate to sample
    // sessions when an error occurs.
    replaysOnErrorSampleRate: 1.0,
    
    integrations: [
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracePropagationTargets: ['localhost', 'dock-swrh68.ges.thm.de', /^\//]
      }),
      new Sentry.Replay()
    ]
  });
}

export default new Vue({
  el: '#app',
  components: { App },
  pinia,
  router,
  i18n
});
