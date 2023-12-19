import { createRouter, createWebHistory } from 'vue-router';
import Login from './views/Login.vue';
import ExternalLogin from './views/ExternalLogin.vue';
import Logout from './views/Logout.vue';
import NotFound from './views/NotFound.vue';
import RoomsIndex from './views/rooms/Index.vue';
import RoomsOwnIndex from './views/rooms/OwnIndex.vue';
import RoomView from './views/rooms/View.vue';
import PermissionService from './services/PermissionService';
import Settings from './views/settings/Settings.vue';
import RolesIndex from './views/settings/roles/Index.vue';
import RolesView from './views/settings/roles/View.vue';
import RoomTypesIndex from './views/settings/roomTypes/Index.vue';
import RoomTypesView from './views/settings/roomTypes/View.vue';
import UsersIndex from './views/settings/users/Index.vue';
import UsersView from './views/settings/users/View.vue';
import NewUser from './views/settings/users/New.vue';
import Application from './views/settings/Application.vue';
import SettingsHome from './views/settings/SettingsHome.vue';
import ServersIndex from './views/settings/servers/Index.vue';
import ServersView from './views/settings/servers/View.vue';
import ServerPoolsIndex from './views/settings/serverPools/Index.vue';
import ServerPoolsView from './views/settings/serverPools/View.vue';
import MeetingsIndex from './views/meetings/Index.vue';
import PasswordReset from './views/PasswordReset.vue';
import Base from './api/base';
import ForgotPassword from './views/ForgotPassword.vue';
import VerifyEmail from './views/VerifyEmail.vue';
import Profile from './views/Profile.vue';
import { useAuthStore } from './stores/auth';
import { useLoadingStore } from './stores/loading';
import { useSettingsStore } from './stores/settings';

const Home = Object.values(import.meta.glob(['../custom/js/views/Home.vue', '@/views/Home.vue'], { eager: true }))[0].default;

export const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { guestsOnly: true }
  },
  {
    path: '/external_login',
    name: 'external_login',
    component: ExternalLogin,
    props: route => {
      return {
        error: route.query.error
      };
    }
  },
  {
    path: '/logout',
    name: 'logout',
    component: Logout,
    meta: { guestsOnly: true },
    props: route => {
      return {
        message: route.query.message
      };
    }
  },
  {
    path: '/reset_password',
    name: 'password.reset',
    component: PasswordReset,
    meta: {
      disabled: () => !useSettingsStore().getSetting('auth.local'),
      guestsOnly: true
    },
    props: route => {
      return {
        token: route.query.token,
        email: route.query.email,
        welcome: route.query.welcome === 'true'
      };
    }
  },
  {
    path: '/verify_email',
    name: 'verify.email',
    component: VerifyEmail,
    meta: {
      disabled: () => !useSettingsStore().getSetting('auth.local'),
      requiresAuth: true
    },
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
    meta: {
      disabled: () => !useSettingsStore().getSetting('password_change_allowed') || !useSettingsStore().getSetting('auth.local'),
      guestsOnly: true
    }
  },
  {
    path: '/rooms',
    name: 'rooms.index',
    component: RoomsIndex,
    meta: { requiresAuth: true }
  },
  {
    path: '/rooms/own',
    name: 'rooms.own_index',
    component: RoomsOwnIndex,
    meta: { requiresAuth: true }
  },
  {
    path: '/rooms/:id/:token?',
    name: 'rooms.view',
    component: RoomView,
    meta: { redirectBackAfterLogin: true }
  },
  {
    path: '/meetings',
    component: MeetingsIndex,
    name: 'meetings.index',
    meta: {
      requiresAuth: true,
      accessPermitted: () => Promise.resolve(PermissionService.can('viewAny', 'MeetingPolicy'))
    }
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
        path: 'users/new',
        name: 'settings.users.new',
        component: NewUser,
        meta: {
          requiresAuth: true,
          disabled: () => !useSettingsStore().getSetting('auth.local'),
          accessPermitted: () => Promise.resolve(
            PermissionService.can('manage', 'SettingPolicy') &&
            PermissionService.can('create', 'UserPolicy')
          )
        }
      },
      {
        path: 'users/:id',
        name: 'settings.users.view',
        component: UsersView,
        props: route => {
          return {
            id: parseInt(route.params.id),
            viewOnly: route.query.view === '1'
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (params, query, vm) => {
            const id = params.id;
            const view = query.view;

            if (view === '1') {
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
    path: '/:pathMatch(.*)*',
    redirect: { name: '404' }
  }
];

/**
 * Callback that gets called before a route gets entered.
 *
 * On first route entering the store gets initialized and the locale from the html `lang`
 * property gets set to the application.
 *
 * For routes where `meta.requiresAuth` and their child pages is set to `true` the user gets
 * redirected to the login page if he isn't authenticated.
 *
 * It is possible to specify a function `meta.disabled` that must return a boolean value whether
 * the route is disabled or not. If the route is disabled the user gets redirected to the 404 page.
 *
 * Also it is possible to specify a function `meta.accessPermitted` that must return a Promise
 * that resolves to a boolean value whether the current user is permitted to access the route.
 * Since it may be that additional data must be requested from the server to perform the permission
 * check it must always be a promise.
 *
 * The meta `redirectBackAfterLogin` can be used for routes that are accessible for users and guests.
 * If a user clicks on the login button in the menu, he will be redirected to the page he was on before (implemented in the App.vue).
 * Note: On pages that are only accessible for users, the user is always (independent of this meta attribute) redirected to the login page and back to the page he was on before.
 *
 * If the meta `guestsOnly` is set for a matched route but the user is logged in, he will
 * be redirected to the home route with a error messsage.
 */
export async function beforeEachRoute (router, to, from, next) {
  const auth = useAuthStore();
  const loading = useLoadingStore();

  // Show loading screen overlay (not unmounting app)
  loading.setOverlayLoading();

  // If app is not initialized yet, initialize it and unmout app until finished only showing loading screen
  if (!loading.initialized) {
    await loading.initialize();
  }

  // Resolve all permission promises for the current route
  const recordsPermissions = await Promise.all(to.matched.map((record) =>
    record.meta.accessPermitted ? record.meta.accessPermitted(to.params, to.query, router.app) : Promise.resolve(true)
  ));

  // Hide loading screen
  loading.setOverlayLoadingFinished();

  // Check if route is disabled
  if (to.matched.some((record) => {
    if (record.meta.disabled !== undefined) {
      return record.meta.disabled(to.params, to.query, router.app);
    }
    return false;
  })) {
    next({ name: '404' });
    return;
  }

  // Check if unauthenticated user tries to access a route that requires authentication
  if (to.matched.some(record => record.meta.requiresAuth) && !auth.isAuthenticated) {
    next({
      name: 'login',
      query: { redirect: to.fullPath }
    });
    return;
  }

  // Check if authenticated user tries to access a route that is only for guests
  if (to.matched.some(record => record.meta.guestsOnly) && auth.isAuthenticated) {
    router.app.$root.toastError(router.app.$t('app.flash.guests_only'));
    next({ name: 'home' });
    return;
  }

  // Check if user doesn't have permission to access a route
  if (!recordsPermissions.every(permission => permission)) {
    router.app.$root.toastError(router.app.$t('app.flash.unauthorized'));
    next(from.matched.length !== 0 ? false : '/');
    return;
  }

  next();
}

export default function () {
  const router = createRouter({
    history: createWebHistory(),
    routes
  });

  router.beforeEach((to, from, next) => beforeEachRoute(router, to, from, next));

  router.onError(error => {
    Base.error(error, router.app.$root);
  });

  return router;
}
