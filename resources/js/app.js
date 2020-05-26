import 'bootstrap';

import Vue from 'vue';
import App from './views/App';
import router from './router';

new Vue({
    el: '#app',
    components: { App },
    router,
});
