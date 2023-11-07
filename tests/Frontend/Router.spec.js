import { beforeEachRoute, routes } from '../../resources/js/router';
import PermissionService from '../../resources/js/services/PermissionService';
import Base from '../../resources/js/api/base';
import { createTestingPinia } from '@pinia/testing';
import { useLoadingStore } from '../../resources/js/stores/loading';
import { useAuthStore } from '../../resources/js/stores/auth';
import { mockAxios } from './helper';
import { it } from 'vitest';

const accessPermittedRolesView = routes.filter(route => route.path === '/settings')[0]
  .children.filter(route => route.name === 'settings.roles.view')[0].meta.accessPermitted;

const accessPermittedUsersView = routes.filter(route => route.path === '/settings')[0]
  .children.filter(route => route.name === 'settings.users.view')[0].meta.accessPermitted;

const accessPermittedNewUsersView = routes.filter(route => route.path === '/settings')[0]
  .children.filter(route => route.name === 'settings.users.new')[0].meta.accessPermitted;

const accessPermittedSettingsView = routes.filter(route => route.path === '/settings')[0]
  .children.filter(route => route.name === 'settings.application')[0].meta.accessPermitted;

const accessPermittedRoomTypesView = routes.filter(route => route.path === '/settings')[0]
  .children.filter(route => route.name === 'settings.room_types.view')[0].meta.accessPermitted;

const accessPermittedServerView = routes.filter(route => route.path === '/settings')[0]
  .children.filter(route => route.name === 'settings.servers.view')[0].meta.accessPermitted;

const accessPermittedServerPoolView = routes.filter(route => route.path === '/settings')[0]
  .children.filter(route => route.name === 'settings.server_pools.view')[0].meta.accessPermitted;

const propsPasswordReset = routes.filter(route => route.path === '/reset_password')[0].props;

const currentUser = { id: 1, firstname: 'Darth', lastname: 'Vader' };

describe('Router', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  describe('beforeEachRoute', () => {
    it('beforeEachRoute sets the application title', async () => {
      const router = {};

      createTestingPinia({ initialState: { settings: { settings: { name: 'Appname' } } }, stubActions: false });
      const loading = useLoadingStore();
      loading.initialized = true;

      const to = {
        matched: [{ path: '/', meta: {} }]
      };

      await new Promise((resolve) => {
        beforeEachRoute(router, to, undefined, () => {
          resolve();
        });
      });

      expect(document.title).toBe('Appname');
    });

    it('beforeEachRoute calls next if there is no permission checks or required authentication', async () => {
      const router = {};

      createTestingPinia();
      const loading = useLoadingStore();
      loading.initialized = true;

      const to = {
        matched: [{ path: '/', meta: {} }]
      };

      let nextCalled = false;

      await new Promise((resolve) => {
        beforeEachRoute(router, to, undefined, () => {
          nextCalled = true;
          resolve();
        });
      });

      expect(nextCalled).toBe(true);
    });

    it('beforeEachRoute calls next with home path if the user is authenticated and the route is only for guests', async () => {
      const router = {
        app: {
          $t: (key) => key,
          $root: {
            toastError: () => {}
          }
        }
      };

      createTestingPinia();
      const loading = useLoadingStore();
      loading.initialized = true;
      const auth = useAuthStore();
      auth.currentUser = currentUser;

      const to = {
        matched: [{
          path: '/foo',
          meta: {
            guestsOnly: true
          }
        }]
      };

      await new Promise((resolve) => {
        beforeEachRoute(router, to, undefined, (args) => {
          expect(args.name).toBe('home');
          resolve();
        });
      });
    });

    it('beforeEachRoute calls next with 404 if the route is disabled', async () => {
      const router = {
        app: {
          $t: (key) => key,
          $root: {
            toastError: () => {}
          }
        }
      };

      createTestingPinia();
      const loading = useLoadingStore();
      loading.initialized = true;
      const auth = useAuthStore();
      auth.currentUser = currentUser;

      const to = {
        matched: [{
          path: '/bar',
          meta: {
            disabled: () => { return true; }
          }
        }]
      };

      await new Promise((resolve) => {
        beforeEachRoute(router, to, undefined, (args) => {
          expect(args.name).toBe('404');
          resolve();
        });
      });
    });

    it('beforeEachRoute calls next if the route is not disabled', async () => {
      const router = {
        app: {
          $t: (key) => key,
          $root: {
            toastError: () => {}
          }
        }
      };

      createTestingPinia();
      const loading = useLoadingStore();
      loading.initialized = true;
      const auth = useAuthStore();
      auth.currentUser = currentUser;

      const to = {
        matched: [{
          path: '/foo',
          meta: {
            disabled: () => { return false; }
          }
        }]
      };

      let nextCalled = false;

      await new Promise((resolve) => {
        beforeEachRoute(router, to, undefined, () => {
          nextCalled = true;
          resolve();
        });
      });

      expect(nextCalled).toBe(true);
    });

    it('beforeEachRoute calls next with login path if the user is not authenticated even if permission check accidentally returns true', async () => {
      const router = {};

      createTestingPinia();
      const loading = useLoadingStore();
      loading.initialized = true;

      const to = {
        matched: [{
          path: '/foo',
          meta: {
            requiresAuth: true,
            accessPermitted: () => true
          }
        }]
      };

      await new Promise((resolve) => {
        beforeEachRoute(router, to, undefined, (args) => {
          expect(args.name).toBe('login');
          resolve();
        });
      });
    });

    it('beforeEachRoute calls next with false or root route if there is no route and access is not permitted', async () => {
      const errors = [];

      const router = {
        app: {
          $t: (key) => key,
          $root: {
            toastError: (error) => errors.push(error)
          }
        }
      };

      createTestingPinia();
      const loading = useLoadingStore();
      loading.initialized = true;
      const auth = useAuthStore();
      auth.currentUser = currentUser;

      const to = {
        matched: [{
          path: '/foo',
          meta: {
            requiresAuth: true,
            accessPermitted: () => false
          }
        }]
      };

      await new Promise((resolve) => {
        beforeEachRoute(router, to, { matched: [] }, (args) => {
          expect(args).toBe('/');
          expect(errors).toHaveLength(1);
          expect(errors[0]).toBe('app.flash.unauthorized');
          resolve();
        });
      });

      await new Promise((resolve) => {
        beforeEachRoute(router, to, { matched: [{ path: '/foo' }] }, (args) => {
          expect(args).toBe(false);
          expect(errors).toHaveLength(2);
          expect(errors[1]).toBe('app.flash.unauthorized');
          resolve();
        });
      });
    });
  });

  describe('accessPermitted', () => {
    it('for role detail view returns true if user has the necessary permissions', async () => {
      const oldUser = PermissionService.currentUser;

      expect(await accessPermittedRolesView({ id: 1 }, { view: '1' })).toBe(false);

      PermissionService.setCurrentUser({ permissions: ['roles.view'] });
      expect(await accessPermittedRolesView({ id: 1 }, { view: '1' })).toBe(false);

      PermissionService.setCurrentUser({ permissions: ['roles.view', 'settings.manage'] });
      expect(await accessPermittedRolesView({ id: 1 }, { view: '1' })).toBe(true);

      PermissionService.setCurrentUser(oldUser);
    });

    it('for role new view returns true if user has the necessary permissions', async () => {
      const oldUser = PermissionService.currentUser;

      expect(await accessPermittedRolesView({ id: 'new' }, {})).toBe(false);

      PermissionService.setCurrentUser({ permissions: ['roles.create'] });
      expect(await accessPermittedRolesView({ id: 'new' }, {})).toBe(false);

      PermissionService.setCurrentUser({ permissions: ['roles.create', 'settings.manage'] });
      expect(await accessPermittedRolesView({ id: 'new' }, {})).toBe(true);

      PermissionService.setCurrentUser(oldUser);
    });

    it('for role update view returns true if user has necessary permissions and role is not a default role', async () => {
      const oldUser = PermissionService.currentUser;
      const response = {
        status: 200,
        data: {
          data: {
            id: 1,
            default: true,
            model_name: 'Role'
          }
        }
      };

      mockAxios.request('/api/v1/roles/1').respondWith(response);

      expect(await accessPermittedRolesView({ id: 1 }, {})).toBe(false);

      PermissionService.setCurrentUser({ permissions: ['roles.update'] });
      mockAxios.request('/api/v1/roles/1').respondWith(response);

      expect(await accessPermittedRolesView({ id: 1 }, {})).toBe(false);

      PermissionService.setCurrentUser({ permissions: ['roles.update', 'settings.manage'] });
      mockAxios.request('/api/v1/roles/1').respondWith(response);

      expect(await accessPermittedRolesView({ id: 1 }, {})).toBe(false);

      mockAxios.request('/api/v1/roles/1').respondWith({
        status: 200,
        data: {
          data: {
            id: 1,
            default: false,
            model_name: 'Role'
          }
        }
      });

      expect(await accessPermittedRolesView({ id: 1 }, {})).toBe(true);

      PermissionService.setCurrentUser(oldUser);
    });

    it('for role update view calls error handler returns false on error in request', async () => {
      const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

      mockAxios.request('/api/v1/roles/1').respondWith({
        status: 500,
        data: {
          message: 'Test'
        }
      });

      expect(await accessPermittedRolesView({ id: 1 }, {})).toBe(false);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('for users detail view returns true if user has the necessary permissions', async () => {
      const oldUser = PermissionService.currentUser;

      expect(await accessPermittedUsersView({ id: 1 }, { view: '1' })).toBe(false);
      PermissionService.setCurrentUser({ permissions: ['users.view'] });

      expect(await accessPermittedUsersView({ id: 1 }, { view: '1' })).toBe(false);
      PermissionService.setCurrentUser({ permissions: ['users.view', 'settings.manage'] });

      expect(await accessPermittedUsersView({ id: 1 }, { view: '1' })).toBe(true);

      PermissionService.setCurrentUser(oldUser);
    });

    it('for users new view returns true if user has the necessary permissions', async () => {
      const oldUser = PermissionService.currentUser;

      expect(await accessPermittedNewUsersView()).toBe(false);

      PermissionService.setCurrentUser({ permissions: ['users.create'] });
      expect(await accessPermittedNewUsersView()).toBe(false);

      PermissionService.setCurrentUser({ permissions: ['users.create', 'settings.manage'] });
      expect(await accessPermittedNewUsersView()).toBe(true);

      PermissionService.setCurrentUser(oldUser);
    });

    it('for users update view returns true if user has the necessary permissions', async () => {
      const oldUser = PermissionService.currentUser;

      expect(await accessPermittedUsersView({ id: 1 }, {})).toBe(false);

      PermissionService.setCurrentUser({ permissions: ['users.update'] });
      expect(await accessPermittedUsersView({ id: 1 }, {})).toBe(false);

      PermissionService.setCurrentUser({ permissions: ['users.update', 'settings.manage'] });
      expect(await accessPermittedUsersView({ id: 1 }, {})).toBe(true);

      PermissionService.setCurrentUser(oldUser);
    });

    it('for application settings update view returns true if user has the necessary permissions', async () => {
      const oldUser = PermissionService.currentUser;

      expect(await accessPermittedSettingsView()).toBe(false);

      PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny'] });
      expect(await accessPermittedSettingsView()).toBe(false);

      PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'applicationSettings.update', 'settings.manage'] });
      expect(await accessPermittedSettingsView()).toBe(true);

      PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'settings.manage'] });
      expect(await accessPermittedSettingsView()).toBe(true);

      PermissionService.setCurrentUser(oldUser);
    });

    it('for room type detail view returns true if user has the necessary permissions', async () => {
      const oldUser = PermissionService.currentUser;

      expect(await accessPermittedRoomTypesView({ id: 1 }, { view: '1' })).toBe(false);

      PermissionService.setCurrentUser({ permissions: ['roomTypes.view'] });
      expect(await accessPermittedRoomTypesView({ id: 1 }, { view: '1' })).toBe(false);

      PermissionService.setCurrentUser({ permissions: ['roomTypes.view', 'settings.manage'] });
      expect(await accessPermittedRoomTypesView({ id: 1 }, { view: '1' })).toBe(true);

      PermissionService.setCurrentUser(oldUser);
    });

    it('for room type new view returns true if user has the necessary permissions', async () => {
      const oldUser = PermissionService.currentUser;

      expect(await accessPermittedRoomTypesView({ id: 'new' }, {})).toBe(false);

      PermissionService.setCurrentUser({ permissions: ['roomTypes.create'] });
      expect(await accessPermittedRoomTypesView({ id: 'new' }, {})).toBe(false);

      PermissionService.setCurrentUser({ permissions: ['roomTypes.create', 'settings.manage'] });
      expect(await accessPermittedRoomTypesView({ id: 'new' }, {})).toBe(true);

      PermissionService.setCurrentUser(oldUser);
    });

    it('for room type update returns true if user has the necessary permissions',
      async () => {
        const oldUser = PermissionService.currentUser;

        expect(await accessPermittedRoomTypesView({ id: 1 }, {})).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roomTypes.update'] });
        expect(await accessPermittedRoomTypesView({ id: 1 }, {})).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roomTypes.update', 'settings.manage'] });
        expect(await accessPermittedRoomTypesView({ id: 1 }, {})).toBe(true);

        PermissionService.setCurrentUser(oldUser);
      }
    );

    it('for server detail view returns true if user has the necessary permissions',
      async () => {
        const oldUser = PermissionService.currentUser;

        expect(await accessPermittedServerView({ id: 1 }, { view: '1' })).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['servers.view'] });
        expect(await accessPermittedServerView({ id: 1 }, { view: '1' })).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['servers.view', 'settings.manage'] });
        expect(await accessPermittedServerView({ id: 1 }, { view: '1' })).toBe(true);

        PermissionService.setCurrentUser(oldUser);
      }
    );

    it('for server new view returns true if user has the necessary permissions',
      async () => {
        const oldUser = PermissionService.currentUser;

        expect(await accessPermittedServerView({ id: 'new' }, {})).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['servers.create'] });
        expect(await accessPermittedServerView({ id: 'new' }, {})).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['servers.create', 'settings.manage'] });
        expect(await accessPermittedServerView({ id: 'new' }, {})).toBe(true);

        PermissionService.setCurrentUser(oldUser);
      }
    );

    it('for server update returns true if user has the necessary permissions',
      async () => {
        const oldUser = PermissionService.currentUser;

        expect(await accessPermittedServerView({ id: 1 }, {})).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['servers.update'] });
        expect(await accessPermittedServerView({ id: 1 }, {})).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['servers.update', 'settings.manage'] });
        expect(await accessPermittedServerView({ id: 1 }, {})).toBe(true);

        PermissionService.setCurrentUser(oldUser);
      }
    );

    it('for server pool detail view returns true if user has the necessary permissions',
      async () => {
        const oldUser = PermissionService.currentUser;

        expect(await accessPermittedServerPoolView({ id: 1 }, { view: '1' })).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['serverPools.view'] });
        expect(await accessPermittedServerPoolView({ id: 1 }, { view: '1' })).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['serverPools.view', 'settings.manage'] });
        expect(await accessPermittedServerPoolView({ id: 1 }, { view: '1' })).toBe(true);

        PermissionService.setCurrentUser(oldUser);
      }
    );

    it('for server pool new view returns true if user has the necessary permissions',
      async () => {
        const oldUser = PermissionService.currentUser;

        expect(await accessPermittedServerPoolView({ id: 'new' }, {})).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['serverPools.create'] });
        expect(await accessPermittedServerPoolView({ id: 'new' }, {})).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['serverPools.create', 'settings.manage'] });
        expect(await accessPermittedServerPoolView({ id: 'new' }, {})).toBe(true);

        PermissionService.setCurrentUser(oldUser);
      }
    );

    it('for server pool update returns true if user has the necessary permissions',
      async () => {
        const oldUser = PermissionService.currentUser;

        expect(await accessPermittedServerPoolView({ id: 1 }, {})).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['serverPools.update'] });
        expect(await accessPermittedServerPoolView({ id: 1 }, {})).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['serverPools.update', 'settings.manage'] });
        expect(await accessPermittedServerPoolView({ id: 1 }, {})).toBe(true);

        PermissionService.setCurrentUser(oldUser);
      }
    );

    it('props for reset_password should return the passed parameters correctly',
      () => {
        expect(propsPasswordReset({ query: {} })).toEqual({ token: undefined, email: undefined, welcome: false });
        expect(propsPasswordReset({ query: { token: 'foo' } })).toEqual({ token: 'foo', email: undefined, welcome: false });
        expect(propsPasswordReset({ query: { email: 'bar' } })).toEqual({ token: undefined, email: 'bar', welcome: false });
        expect(propsPasswordReset({ query: { token: 'foo', email: 'bar' } })).toEqual({ token: 'foo', email: 'bar', welcome: false });
        expect(propsPasswordReset({ query: { token: 'foo', email: 'bar', welcome: 'true' } })).toEqual({ token: 'foo', email: 'bar', welcome: true });
      }
    );
  });
});
