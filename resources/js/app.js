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

export default new Vue({
  el: '#app',
  components: { App },
  router,
  store,
  i18n
});
