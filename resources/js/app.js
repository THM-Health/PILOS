import './bootstrap';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import Vue from 'vue';
import store from './store';
import App from './views/App';
import router from './router';
import i18n from './i18n';
import FlashMessage from '@smartweb/vue-flash-message';
import Clipboard from 'v-clipboard';

Vue.use(Clipboard);
// Install BootstrapVue
Vue.use(BootstrapVue);
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin);

Vue.use(FlashMessage, {
  strategy: 'multiple'
});

// Add accessibility check tools for development
if (process.env.NODE_ENV === 'development') {
  const VueAxe = require('vue-axe').default;
  Vue.use(VueAxe);
}

/**
 * Global error handler for unhandled errors that can occur in the application.
 *
 * Make sure that you catch possible errors caused by requests to the server (e.g. validation errors)
 * in the appropriate place in the application. This handler is only for the last instance if there
 * is something going on, that should be normally.
 *
 * @param error The occurred error
 * @param vm The vue instance
 * @param info Some additional error information
 */
Vue.config.errorHandler = function (error, vm, info) {
  const responseStatus = error.response !== undefined ? error.response.status : undefined;
  const errorMessage = error.response.data ? error.response.data.message : undefined;

  if (responseStatus === 401) { // 401 => unauthorized, redirect and show error messages as flash!
    if (vm.$store.getters['session/isAuthenticated']) {
      vm.flashMessage.info(vm.$t('app.flash.unauthenticated'));
      vm.$store.commit('session/setCurrentUser', null);
      vm.$router.replace({ name: 'login' });
    }
  } else if (responseStatus === 403 && errorMessage === 'This action is unauthorized.') { // 403 => unauthorized, show error messages as flash!
    vm.flashMessage.error(vm.$t('app.flash.unauthorized'));
  } else if (responseStatus === 420) { // 420 => only for guests, redirect to home route
    vm.flashMessage.info(vm.$t('app.flash.guestsOnly'));
    vm.$router.replace({ name: 'home' });
  } else if (responseStatus !== undefined) { // Another error on server
    vm.flashMessage.error({
      message: errorMessage ? vm.$t('app.flash.serverError.message', { message: errorMessage }) : vm.$t('app.flash.serverError.emptyMessage'),
      title: vm.$t('app.flash.serverError.title', { statusCode: responseStatus }),
      contentClass: 'flash_small_title flex-column-reverse d-flex'
    });
  } else {
    vm.flashMessage.error(vm.$t('app.flash.clientError'));
    console.error(`Error: ${error.toString()}\nInfo: ${info}`);
  }
};

export default new Vue({
  el: '#app',
  components: { App },
  router,
  store,
  i18n
});
