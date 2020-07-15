import './bootstrap'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import Vue from 'vue'
import store from './store'
import App from './views/App'
import router from './router'
import Clipboard from 'v-clipboard'

Vue.use(Clipboard)
// Install BootstrapVue
Vue.use(BootstrapVue)
Vue.use(Clipboard)
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin)

export default new Vue({
  el: '#app',
  components: { App },
  router,
  store
})
