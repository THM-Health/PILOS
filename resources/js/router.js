import VueRouter from 'vue-router';
import Login from './views/Login';
import NotFound from './views/NotFound';
import RoomsIndex from './views/rooms/Index';
import RoomView from './views/rooms/View';
import AdminIndex from './views/admin/Index';
import AdminUsers from './views/admin/Users';
import AdminRoles from './views/admin/Roles';
import AdminSiteSettings from './views/admin/SiteSettings';
import AdminRecordings from './views/admin/Recordings';
import AdminRooms from './views/admin/Rooms';
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
      path: '/admin',
      component: AdminIndex,
      meta: { requiresAuth: true },
      children: [
        {
          path: '/admin',
          name: 'admin.index',
          component: AdminUsers
        },
        {
          path: '/admin/rooms',
          name: 'admin.rooms',
          component: AdminRooms
        },
        {
          path: '/admin/recordings',
          name: 'admin.recordings',
          component: AdminRecordings
        },
        {
          path: '/admin/site-settings',
          name: 'admin.siteSettings',
          component: AdminSiteSettings
        },
        {
          path: '/admin/roles',
          name: 'admin.roles',
          component: AdminRoles
        }
      ]
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

/**
 * Callback that gets called before a route gets entered.
 *
 * On first route entering the store gets initialized and the locale from the html `lang`
 * property gets set to the application.
 *
 * For routes where `meta.requiresAuth` and their child pages is set to `true` the user gets
 * redirected to the login page if he isn't authenticated.
 *
 * Also it is possible to specify a function `meta.accessPermitted` that must return a Promise
 * that resolves to a boolean value whether the current user is permitted to access the route.
 * Since it may be that additional data must be requested from the server to perform the permission
 * check it must always be a promise.
 */
router.beforeEach((to, from, next) => {
  const locale = $('html').prop('lang') || process.env.MIX_DEFAULT_LOCALE;
  const initializationPromise = !store.state.initialized ? store.dispatch('initialize', { locale }) : Promise.resolve();

  initializationPromise.then(() => {
    return Promise.all(to.matched.map((record) =>
      record.meta.accessPermitted ? record.meta.accessPermitted() : Promise.resolve(true)
    ));
  }).then((recordsPermissions) => {
    if (to.matched.some(record => record.meta.requiresAuth) && !store.getters['session/isAuthenticated']) {
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      });
    } else if (!recordsPermissions.every(permission => permission)) {
      router.app.$root.flashMessage.error(router.app.$t('app.flash.unauthorized'));
      next(from.matched.length !== 0 ? false : '/');
    } else {
      next();
    }
  });
});

export default router;
