import 'bootstrap';

import Vue from 'vue';
import VueRouter from "vue-router";

Vue.use(VueRouter);

import App from './views/App';

// const router = new VueRouter({
//     mode: 'history',
//     routes: [
//         {
//
//         },
//     ],
// })

const app = new Vue({
    el: '#app',
    components: { App }
});
