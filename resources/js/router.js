import VueRouter from 'vue-router';
import Login from './views/Login';
import NotFound from './views/NotFound';
import RoomsIndex from './views/rooms/Index';
import RoomView from './views/rooms/View';
import store from './store';
import Home from './views/Home';
import Vue from 'vue';
import PermissionService from './services/PermissionService';
import Settings from './views/settings/Settings';
import RolesIndex from './views/settings/roles/Index';
import RolesView from './views/settings/roles/View';
import RoomTypesIndex from './views/settings/roomTypes/Index';
import RoomTypesView from './views/settings/roomTypes/View';
import UsersIndex from './views/settings/users/Index';
import UsersView from './views/settings/users/View';
import Application from './views/settings/Application';
import SettingsHome from './views/settings/SettingsHome';
import ServersIndex from './views/settings/servers/Index';
import ServersView from './views/settings/servers/View';
import ServerPoolsIndex from './views/settings/serverPools/Index';
import ServerPoolsView from './views/settings/serverPools/View';
import PasswordReset from './views/PasswordReset';
import Base from './api/base';
import ForgotPassword from './views/ForgotPassword';

Vue.use(VueRouter);

export const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/profile',
    name: 'profile',
    component: UsersView,
    props: () => {
      return {
        config: {
          id: store.state.session.currentUser ? store.state.session.currentUser.id : 0,
          type: 'profile'
        }
      };
    },
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { guestsOnly: true }
  },
  {
    path: '/reset_password',
    name: 'password.reset',
    component: PasswordReset,
    meta: { guestsOnly: true },
    props: route => {
      return {
        token: route.query.token,
        email: route.query.email
      };
    }
  },
  {
    path: '/forgot_password',
    name: 'password.forgot',
    component: ForgotPassword,
    meta: { guestsOnly: true }
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
    path: '/settings',
    component: Settings,
    meta: {
      requiresAuth: true,
      accessPermitted: () => Promise.resolve(PermissionService.can('manage', 'SettingPolicy'))
    },
    children: [
      {
        path: '',
        component: SettingsHome,
        name: 'settings'
      },
      {
        path: 'users',
        component: UsersIndex,
        name: 'settings.users',
        meta: {
          requiresAuth: true,
          accessPermitted: () => Promise.resolve(
            PermissionService.can('manage', 'SettingPolicy') &&
            PermissionService.can('viewAny', 'UserPolicy')
          )
        }
      },
      {
        path: 'users/:id',
        name: 'settings.users.view',
        component: UsersView,
        props: route => {
          return {
            config: {
              id: route.params.id,
              type: route.query.view === '1' ? 'view' : 'edit'
            }
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (params, query, vm) => {
            const id = params.id;
            const view = query.view;

            if (id === 'new') {
              return Promise.resolve(
                PermissionService.can('manage', 'SettingPolicy') &&
                PermissionService.can('create', 'UserPolicy')
              );
            } else if (view === '1') {
              return Promise.resolve(
                PermissionService.can('manage', 'SettingPolicy') &&
                PermissionService.can('view', { model_name: 'User', id })
              );
            }

            return Promise.resolve(
              PermissionService.can('manage', 'SettingPolicy') &&
              PermissionService.can('update', { model_name: 'User', id })
            );
          }
        }
      },
      {
        path: 'roles',
        name: 'settings.roles',
        component: RolesIndex,
        meta: {
          requiresAuth: true,
          accessPermitted: () => Promise.resolve(
            PermissionService.can('manage', 'SettingPolicy') &&
            PermissionService.can('viewAny', 'RolePolicy')
          )
        }
      },
      {
        path: 'roles/:id',
        name: 'settings.roles.view',
        component: RolesView,
        props: route => {
          return {
            id: route.params.id,
            viewOnly: route.query.view === '1'
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (params, query, vm) => {
            const id = params.id;
            const view = query.view;

            if (id === 'new') {
              return Promise.resolve(
                PermissionService.can('manage', 'SettingPolicy') &&
                PermissionService.can('create', 'RolePolicy')
              );
            } else if (view === '1') {
              return Promise.resolve(
                PermissionService.can('manage', 'SettingPolicy') &&
                PermissionService.can('view', 'RolePolicy')
              );
            }

            return Base.call(`roles/${id}`).then((response) => {
              return PermissionService.can('manage', 'SettingPolicy') &&
                PermissionService.can('update', response.data.data);
            }).catch((response) => {
              Base.error(response, vm, response.message);
              return false;
            });
          }
        }
      },
      {
        path: 'application',
        name: 'settings.application',
        component: Application,
        meta: {
          requiresAuth: true,
          accessPermitted: () => Promise.resolve(
            PermissionService.can('manage', 'SettingPolicy') &&
            PermissionService.can('viewAny', 'ApplicationSettingPolicy')
          )
        }
      },
      {
        path: 'room_types',
        name: 'settings.room_types',
        component: RoomTypesIndex,
        meta: {
          requiresAuth: true,
          accessPermitted: () => Promise.resolve(
            PermissionService.can('manage', 'SettingPolicy')
          )
        }
      },
      {
        path: 'room_types/:id',
        name: 'settings.room_types.view',
        component: RoomTypesView,
        props: route => {
          return {
            id: route.params.id,
            viewOnly: route.query.view === '1'
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (params, query, vm) => {
            const id = params.id;
            const view = query.view;

            if (id === 'new') {
              return Promise.resolve(
                PermissionService.can('manage', 'SettingPolicy') &&
                PermissionService.can('create', 'RoomTypePolicy')
              );
            } else if (view === '1') {
              return Promise.resolve(
                PermissionService.can('manage', 'SettingPolicy') &&
                PermissionService.can('view', 'RoomTypePolicy')
              );
            }

            return Promise.resolve(
              PermissionService.can('manage', 'SettingPolicy') &&
              PermissionService.can('update', 'RoomTypePolicy')
            );
          }
        }
      },
      {
        path: 'servers',
        name: 'settings.servers',
        component: ServersIndex,
        meta: {
          requiresAuth: true,
          accessPermitted: () => Promise.resolve(
            PermissionService.can('manage', 'SettingPolicy') &&
            PermissionService.can('viewAny', 'ServerPolicy')
          )
        }
      },
      {
        path: 'servers/:id',
        name: 'settings.servers.view',
        component: ServersView,
        props: route => {
          return {
            id: route.params.id,
            viewOnly: route.query.view === '1'
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (params, query, vm) => {
            const id = params.id;
            const view = query.view;

            if (id === 'new') {
              return Promise.resolve(
                PermissionService.can('manage', 'SettingPolicy') &&
                PermissionService.can('create', 'ServerPolicy')
              );
            } else if (view === '1') {
              return Promise.resolve(
                PermissionService.can('manage', 'SettingPolicy') &&
                PermissionService.can('view', 'ServerPolicy')
              );
            }
            return Promise.resolve(
              PermissionService.can('manage', 'SettingPolicy') &&
              PermissionService.can('update', 'ServerPolicy')
            );
          }
        }
      },
      {
        path: 'server_pools',
        name: 'settings.server_pools',
        component: ServerPoolsIndex,
        meta: {
          requiresAuth: true,
          accessPermitted: () => Promise.resolve(
            PermissionService.can('manage', 'SettingPolicy') &&
            PermissionService.can('viewAny', 'ServerPoolPolicy')
          )
        }
      },
      {
        path: 'server_pools/:id',
        name: 'settings.server_pools.view',
        component: ServerPoolsView,
        props: route => {
          return {
            id: route.params.id,
            viewOnly: route.query.view === '1'
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (params, query, vm) => {
            const id = params.id;
            const view = query.view;

            if (id === 'new') {
              return Promise.resolve(
                PermissionService.can('manage', 'SettingPolicy') &&
                PermissionService.can('create', 'ServerPoolPolicy')
              );
            } else if (view === '1') {
              return Promise.resolve(
                PermissionService.can('manage', 'SettingPolicy') &&
                PermissionService.can('view', 'ServerPoolPolicy')
              );
            }
            return Promise.resolve(
              PermissionService.can('manage', 'SettingPolicy') &&
              PermissionService.can('update', 'ServerPoolPolicy')
            );
          }
        }
      }
    ]
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
];

const router = new VueRouter({
  mode: 'history',
  routes
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
export function beforeEachRoute (router, store, to, from, next) {
  const locale = $('html').prop('lang') || process.env.MIX_DEFAULT_LOCALE;
  const initializationPromise = !store.state.initialized ? store.dispatch('initialize', { locale }) : Promise.resolve();

  store.commit('loading');
  initializationPromise.then(() => {
    return Promise.all(to.matched.map((record) =>
      record.meta.accessPermitted ? record.meta.accessPermitted(to.params, to.query, router.app) : Promise.resolve(true)
    ));
  }).then((recordsPermissions) => {
    store.commit('loadingFinished');
    if (to.matched.some(record => record.meta.requiresAuth) && !store.getters['session/isAuthenticated']) {
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      });
    } else if (to.matched.some(record => record.meta.guestsOnly) && store.getters['session/isAuthenticated']) {
      router.app.$root.flashMessage.error(router.app.$t('app.flash.guestsOnly'));
      next({ name: 'home' });
    } else if (!recordsPermissions.every(permission => permission)) {
      router.app.$root.flashMessage.error(router.app.$t('app.flash.unauthorized'));
      next(from.matched.length !== 0 ? false : '/');
    } else {
      next();
    }
  });
}

router.beforeEach((to, from, next) => beforeEachRoute(router, store, to, from, next));

router.onError(error => {
  Base.error(error, router.app.$root);
});

export default router;
