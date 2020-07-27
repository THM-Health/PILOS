import VueRouter from 'vue-router';
import Login from './views/Login';
import NotFound from './views/NotFound';
import RoomsIndex from './views/rooms/Index';
import RoomView from './views/rooms/View';
import store from './store';
import Home from './views/Home';
import Vue from 'vue';

Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/rooms',
      name: 'rooms.index',
      component: RoomsIndex,
      meta: { requiresAuth: true }
    },
    {
      path: '/rooms/:id',
      name: 'rooms.view',
      component: RoomView
    },

    {
      path: '/rooms/join/:id',
      name: 'rooms.join',
      component: RoomView
    },

    {
      path: '/404',
      name: '404',
      component: NotFound
    },
    {
      path: '*',
      redirect: '/404'
    }
  ]
});

router.beforeEach((to, from, next) => {
  const locale = $('html').prop('lang') || 'en';
  const promise = !store.state.initialized ? store.dispatch('initialize', { locale }) : Promise.resolve();

  promise.then(() => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
      if (!store.getters['session/isAuthenticated']) {
        next({
          name: 'login',
          query: { redirect: to.fullPath }
        });
      } else {
        next();
      }
    } else {
      next();
    }
  });
});

export default router;
