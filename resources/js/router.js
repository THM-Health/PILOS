import { createRouter, createWebHistory } from 'vue-router';
import Login from './views/Login.vue';
import ExternalLogin from './views/ExternalLogin.vue';
import Logout from './views/Logout.vue';
import NotFound from './views/NotFound.vue';
import RoomsIndex from './views/RoomsIndex.vue';
import RoomView from './views/RoomsView.vue';
import AdminLayout from './views/AdminLayout.vue';
import RolesIndex from './views/AdminRolesIndex.vue';
import RolesView from './views/AdminRolesView.vue';
import RoomTypesIndex from './views/AdminRoomTypesIndex.vue';
import RoomTypesView from './views/AdminRoomTypesView.vue';
import UsersIndex from './views/AdminUsersIndex.vue';
import UsersView from './views/AdminUsersView.vue';
import NewUser from './views/AdminUsersNew.vue';
import AdminSettings from './views/AdminSettings.vue';
import AdminIndex from './views/AdminIndex.vue';
import ServersIndex from './views/AdminServersIndex.vue';
import ServersView from './views/AdminServersView.vue';
import ServerPoolsIndex from './views/AdminServerPoolsIndex.vue';
import ServerPoolsView from './views/AdminServerPoolsView.vue';
import MeetingsIndex from './views/MeetingsIndex.vue';
import PasswordReset from './views/PasswordReset.vue';
import ForgotPassword from './views/ForgotPassword.vue';
import VerifyEmail from './views/VerifyEmail.vue';
import Profile from './views/Profile.vue';
import { useAuthStore } from './stores/auth';
import { useLoadingStore } from './stores/loading';
import { useSettingsStore } from './stores/settings';
import { useToast } from './composables/useToast';
import i18n from './i18n';
import { useUserPermissions } from './composables/useUserPermission.js';
import { useApi } from './composables/useApi.js';

const Home = Object.values(import.meta.glob(['../custom/js/views/Home.vue', './views/Home.vue'], { eager: true }))[0].default;

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
        message: route.query.message,
        incompleteWarning: route.params.incompleteWarning
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
      disabled: () => !useSettingsStore().getSetting('user.password_change_allowed') || !useSettingsStore().getSetting('auth.local'),
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
    path: '/rooms/:id/:token?',
    name: 'rooms.view',
    component: RoomView,
    meta: { redirectBackAfterLogin: true },
    props: route => {
      return {
        id: route.params.id,
        token: route.params.token
      };
    }
  },
  {
    path: '/meetings',
    component: MeetingsIndex,
    name: 'meetings.index',
    meta: {
      requiresAuth: true,
      accessPermitted: (userPermissions) => Promise.resolve(userPermissions.can('viewAny', 'MeetingPolicy'))
    }
  },

  {
    path: '/admin',
    component: AdminLayout,
    meta: {
      requiresAuth: true,
      accessPermitted: (userPermissions) => Promise.resolve(userPermissions.can('view', 'AdminPolicy'))
    },
    children: [
      {
        path: '',
        component: AdminIndex,
        name: 'admin'
      },
      {
        path: 'users',
        component: UsersIndex,
        name: 'admin.users',
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions) => Promise.resolve(
            userPermissions.can('view', 'AdminPolicy') &&
            userPermissions.can('viewAny', 'UserPolicy')
          )
        }
      },
      {
        path: 'users/new',
        name: 'admin.users.new',
        component: NewUser,
        meta: {
          requiresAuth: true,
          disabled: () => !useSettingsStore().getSetting('auth.local'),
          accessPermitted: (userPermissions) => Promise.resolve(
            userPermissions.can('view', 'AdminPolicy') &&
            userPermissions.can('create', 'UserPolicy')
          )
        }
      },
      {
        path: 'users/:id',
        name: 'admin.users.view',
        component: UsersView,
        props: route => {
          return {
            id: parseInt(route.params.id),
            viewOnly: true
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions, params, query, vm) => {
            const id = params.id;

            return Promise.resolve(
              userPermissions.can('view', 'AdminPolicy') &&
              userPermissions.can('view', { model_name: 'User', id })
            );
          }
        }
      },
      {
        path: 'users/:id/edit',
        name: 'admin.users.edit',
        component: UsersView,
        props: route => {
          return {
            id: parseInt(route.params.id),
            viewOnly: false
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions, params, query, vm) => {
            const id = params.id;

            return Promise.resolve(
              userPermissions.can('view', 'AdminPolicy') &&
              userPermissions.can('update', { model_name: 'User', id })
            );
          }
        }
      },
      {
        path: 'roles',
        name: 'admin.roles',
        component: RolesIndex,
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions) => Promise.resolve(
            userPermissions.can('view', 'AdminPolicy') &&
              userPermissions.can('viewAny', 'RolePolicy')
          )
        }
      },
      {
        path: 'roles/new',
        name: 'admin.roles.new',
        component: RolesView,
        props: route => {
          return {
            id: 'new',
            viewOnly: false
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions, params, query, vm) => {
            return Promise.resolve(
              userPermissions.can('view', 'AdminPolicy') &&
                userPermissions.can('create', 'RolePolicy')
            );
          }
        }
      },
      {
        path: 'roles/:id',
        name: 'admin.roles.view',
        component: RolesView,
        props: route => {
          return {
            id: route.params.id,
            viewOnly: true
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions, params, query, vm) => {
            return Promise.resolve(
              userPermissions.can('view', 'AdminPolicy') &&
              userPermissions.can('view', 'RolePolicy')
            );
          }
        }
      },
      {
        path: 'roles/:id/edit',
        name: 'admin.roles.edit',
        component: RolesView,
        props: route => {
          return {
            id: route.params.id,
            viewOnly: false
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions, params, query, vm) => {
            return Promise.resolve(
              userPermissions.can('view', 'AdminPolicy') &&
              userPermissions.can('update', 'RolePolicy')
            );
          }
        }
      },
      {
        path: 'settings',
        name: 'admin.settings',
        component: AdminSettings,
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions) => Promise.resolve(
            userPermissions.can('view', 'AdminPolicy') &&
              userPermissions.can('viewAny', 'SettingsPolicy')
          )
        }
      },
      {
        path: 'room_types',
        name: 'admin.room_types',
        component: RoomTypesIndex,
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions) => Promise.resolve(
            userPermissions.can('view', 'AdminPolicy')
          )
        }
      },
      {
        path: 'room_types/new',
        name: 'admin.room_types.new',
        component: RoomTypesView,
        props: route => {
          return {
            id: 'new',
            viewOnly: false
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions, params, query) => {
            return Promise.resolve(
              userPermissions.can('view', 'AdminPolicy') &&
              userPermissions.can('create', 'RoomTypePolicy')
            );
          }
        }
      },
      {
        path: 'room_types/:id',
        name: 'admin.room_types.view',
        component: RoomTypesView,
        props: route => {
          return {
            id: route.params.id,
            viewOnly: true
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions, params, query) => {
            return Promise.resolve(
              userPermissions.can('view', 'AdminPolicy') &&
                userPermissions.can('view', 'RoomTypePolicy')
            );
          }
        }
      },
      {
        path: 'room_types/:id/edit',
        name: 'admin.room_types.edit',
        component: RoomTypesView,
        props: route => {
          return {
            id: route.params.id,
            viewOnly: false
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions, params, query) => {
            return Promise.resolve(
              userPermissions.can('view', 'AdminPolicy') &&
              userPermissions.can('update', 'RoomTypePolicy')
            );
          }
        }
      },
      {
        path: 'servers',
        name: 'admin.servers',
        component: ServersIndex,
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions) => Promise.resolve(
            userPermissions.can('view', 'AdminPolicy') &&
              userPermissions.can('viewAny', 'ServerPolicy')
          )
        }
      },
      {
        path: 'servers/new',
        name: 'admin.servers.new',
        component: ServersView,
        props: route => {
          return {
            id: 'new',
            viewOnly: false
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions, params, query) => {
            return Promise.resolve(
              userPermissions.can('view', 'AdminPolicy') &&
              userPermissions.can('create', 'ServerPolicy')
            );
          }
        }
      },
      {
        path: 'servers/:id',
        name: 'admin.servers.view',
        component: ServersView,
        props: route => {
          return {
            id: route.params.id,
            viewOnly: true
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions, params, query) => {
            return Promise.resolve(
              userPermissions.can('view', 'AdminPolicy') &&
                userPermissions.can('view', 'ServerPolicy')
            );
          }
        }
      },
      {
        path: 'servers/:id/edit',
        name: 'admin.servers.edit',
        component: ServersView,
        props: route => {
          return {
            id: route.params.id,
            viewOnly: false
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions, params, query) => {
            return Promise.resolve(
              userPermissions.can('view', 'AdminPolicy') &&
              userPermissions.can('update', 'ServerPolicy')
            );
          }
        }
      },
      {
        path: 'server_pools',
        name: 'admin.server_pools',
        component: ServerPoolsIndex,
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions) => Promise.resolve(
            userPermissions.can('view', 'AdminPolicy') &&
              userPermissions.can('viewAny', 'ServerPoolPolicy')
          )
        }
      },
      {
        path: 'server_pools/new',
        name: 'admin.server_pools.new',
        component: ServerPoolsView,
        props: route => {
          return {
            id: 'new',
            viewOnly: false
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions, params, query) => {
            return Promise.resolve(
              userPermissions.can('view', 'AdminPolicy') &&
              userPermissions.can('create', 'ServerPoolPolicy')
            );
          }
        }
      },
      {
        path: 'server_pools/:id',
        name: 'admin.server_pools.view',
        component: ServerPoolsView,
        props: route => {
          return {
            id: route.params.id,
            viewOnly: true
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions, params, query) => {
            return Promise.resolve(
              userPermissions.can('view', 'AdminPolicy') &&
                userPermissions.can('view', 'ServerPoolPolicy')
            );
          }
        }
      },
      {
        path: 'server_pools/:id/edit',
        name: 'admin.server_pools.edit',
        component: ServerPoolsView,
        props: route => {
          return {
            id: route.params.id,
            viewOnly: false
          };
        },
        meta: {
          requiresAuth: true,
          accessPermitted: (userPermissions, params, query) => {
            return Promise.resolve(
              userPermissions.can('view', 'AdminPolicy') &&
              userPermissions.can('update', 'ServerPoolPolicy')
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
  const settings = useSettingsStore();
  const userPermissions = useUserPermissions();
  const toast = useToast();
  const { t } = i18n.global;

  // If app is not initialized yet, initialize it and unmout app until finished only showing loading screen
  if (!loading.initialized) {
    await loading.initialize();
  }

  // Set the application name as title if loaded, otherwise the title from the html template is used
  document.title = settings.getSetting('general.name');

  // Resolve all permission promises for the current route
  const recordsPermissions = await Promise.all(to.matched.map((record) =>
    record.meta.accessPermitted ? record.meta.accessPermitted(userPermissions, to.params, to.query) : Promise.resolve(true)
  ));

  // Hide loading screen
  loading.setOverlayLoadingFinished();

  // Check if route is disabled
  if (to.matched.some((record) => {
    if (record.meta.disabled !== undefined) {
      return record.meta.disabled(to.params, to.query);
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
    toast.error(t('app.flash.guests_only'));
    next({ name: 'home' });
    return;
  }

  // Check if user doesn't have permission to access a route
  if (!recordsPermissions.every(permission => permission)) {
    toast.error(t('app.flash.unauthorized'));
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
    const api = useApi();
    api.error(error);
  });

  return router;
}
