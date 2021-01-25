import { beforeEachRoute, routes } from '../../resources/js/router';
import PermissionService from '../../resources/js/services/PermissionService';
import moxios from 'moxios';
import sinon from 'sinon';
import Base from '../../resources/js/api/base';

const accessPermittedRolesView = routes.filter(route => route.path === '/settings')[0]
  .children.filter(route => route.name === 'settings.roles.view')[0].meta.accessPermitted;

const accessPermittedUsersView = routes.filter(route => route.path === '/settings')[0]
  .children.filter(route => route.name === 'settings.users.view')[0].meta.accessPermitted;

const accessPermittedSettingsView = routes.filter(route => route.path === '/settings')[0]
  .children.filter(route => route.name === 'settings.application')[0].meta.accessPermitted;

const accessPermittedRoomTypesView = routes.filter(route => route.path === '/settings')[0]
  .children.filter(route => route.name === 'settings.room_types.view')[0].meta.accessPermitted;

const accessPermittedServerView = routes.filter(route => route.path === '/settings')[0]
  .children.filter(route => route.name === 'settings.servers.view')[0].meta.accessPermitted;

const accessPermittedServerPoolView = routes.filter(route => route.path === '/settings')[0]
  .children.filter(route => route.name === 'settings.server_pools.view')[0].meta.accessPermitted;

describe('Router', function () {
  beforeEach(function () {
    moxios.install();
  });

  afterEach(function () {
    moxios.uninstall();
  });

  describe('beforeEachRoute', function () {
    it('beforeEachRoute calls next if there is no permission checks or required authentication', function (done) {
      const router = {};

      const store = {
        getters: {
          'session/isAuthenticated': true
        },
        state: {
          initialized: true
        },
        commit: () => {}
      };

      const to = {
        matched: [{ path: '/', meta: {} }]
      };

      let nextCalled = false;

      new Promise((resolve) => {
        beforeEachRoute(router, store, to, undefined, () => {
          nextCalled = true;
          resolve();
        });
      }).then(() => {
        expect(nextCalled).toBe(true);
        done();
      });
    });

    it('beforeEachRoute calls next with login path if the user is not authenticated even if permission check accidentally returns true', function (done) {
      const router = {};

      const store = {
        getters: {
          'session/isAuthenticated': false
        },
        state: {
          initialized: true
        },
        commit: () => {}
      };

      const to = {
        matched: [{
          path: '/foo',
          meta: {
            requiresAuth: true,
            accessPermitted: () => true
          }
        }]
      };

      beforeEachRoute(router, store, to, undefined, (args) => {
        expect(args.name).toBe('login');
        done();
      });
    });

    it('beforeEachRoute calls next with false or root route if there is no route and access is not permitted', function (done) {
      const errors = [];

      const router = {
        app: {
          $t: (key) => key,
          $root: {
            flashMessage: {
              error: (error) => errors.push(error)
            }
          }
        }
      };

      const store = {
        getters: {
          'session/isAuthenticated': true
        },
        state: {
          initialized: true
        },
        commit: () => {}
      };

      const to = {
        matched: [{
          path: '/foo',
          meta: {
            requiresAuth: true,
            accessPermitted: () => false
          }
        }]
      };

      beforeEachRoute(router, store, to, { matched: [] }, (args) => {
        expect(args).toBe('/');
        expect(errors).toHaveLength(1);
        expect(errors[0]).toBe('app.flash.unauthorized');

        beforeEachRoute(router, store, to, { matched: [{ path: '/foo' }] }, (args) => {
          expect(args).toBe(false);
          expect(errors).toHaveLength(2);
          expect(errors[1]).toBe('app.flash.unauthorized');
          done();
        });
      });
    });
  });

  describe('accessPermitted', function () {
    it('for role detail view returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermittedRolesView({ id: 1 }, { view: '1' }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roles.view'] });
        return accessPermittedRolesView({ id: 1 }, { view: '1' });
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roles.view', 'settings.manage'] });
        return accessPermittedRolesView({ id: 1 }, { view: '1' });
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for role new view returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermittedRolesView({ id: 'new' }, {}).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roles.create'] });
        return accessPermittedRolesView({ id: 'new' }, {});
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roles.create', 'settings.manage'] });
        return accessPermittedRolesView({ id: 'new' }, {});
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for role update view returns true if user has necessary permissions and role is not a default role', function (done) {
      const oldUser = PermissionService.currentUser;
      const respond = function () {
        const request = moxios.requests.mostRecent();
        request.respondWith({
          status: 200,
          response: {
            data: {
              id: 1,
              default: true,
              model_name: 'Role'
            }
          }
        });
      };

      moxios.wait(respond);

      accessPermittedRolesView({ id: 1 }, {}).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roles.update'] });
        moxios.wait(respond);

        return accessPermittedRolesView({ id: 1 }, {});
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roles.update', 'settings.manage'] });
        moxios.wait(respond);

        return accessPermittedRolesView({ id: 1 }, {});
      }).then(result => {
        expect(result).toBe(false);

        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          return request.respondWith({
            status: 200,
            response: {
              data: {
                id: 1,
                default: false,
                model_name: 'Role'
              }
            }
          });
        });

        return accessPermittedRolesView({ id: 1 }, {});
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for role update view calls error handler returns false on error in request', function (done) {
      const spy = sinon.spy();
      sinon.stub(Base, 'error').callsFake(spy);

      moxios.wait(function () {
        const request = moxios.requests.mostRecent();
        request.respondWith({
          status: 500,
          response: {
            message: 'Test'
          }
        });
      });

      accessPermittedRolesView({ id: 1 }, {}).then(result => {
        expect(result).toBe(false);
        sinon.assert.calledOnce(Base.error);
        Base.error.restore();
        done();
      });
    });

    it('for users detail view returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermittedUsersView({ id: 1 }, { view: '1' }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['users.view'] });
        return accessPermittedUsersView({ id: 1 }, { view: '1' });
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['users.view', 'settings.manage'] });
        return accessPermittedUsersView({ id: 1 }, { view: '1' });
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for users new view returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermittedUsersView({ id: 'new' }, {}).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['users.create'] });
        return accessPermittedUsersView({ id: 'new' }, {});
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['users.create', 'settings.manage'] });
        return accessPermittedUsersView({ id: 'new' }, {});
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for users update view returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermittedUsersView({ id: 1 }, {}).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['users.update'] });
        return accessPermittedUsersView({ id: 1 }, {});
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['users.update', 'settings.manage'] });
        return accessPermittedUsersView({ id: 1 }, {});
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for application settings update view returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermittedSettingsView().then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['settings.viewAny'] });
        return accessPermittedSettingsView();
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['settings.viewAny', 'settings.update', 'settings.manage'] });
        return accessPermittedSettingsView();
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser({ permissions: ['settings.viewAny', 'settings.manage'] });
        return accessPermittedSettingsView();
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for room type detail view returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermittedRoomTypesView({ id: 1 }, { view: '1' }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roomTypes.view'] });
        return accessPermittedRoomTypesView({ id: 1 }, { view: '1' });
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roomTypes.view', 'settings.manage'] });
        return accessPermittedRoomTypesView({ id: 1 }, { view: '1' });
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for room type new view returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermittedRoomTypesView({ id: 'new' }, {}).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roomTypes.create'] });
        return accessPermittedRoomTypesView({ id: 'new' }, {});
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roomTypes.create', 'settings.manage'] });
        return accessPermittedRoomTypesView({ id: 'new' }, {});
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for room type update returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermittedRoomTypesView({ id: 1 }, {}).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roomTypes.update'] });
        return accessPermittedRoomTypesView({ id: 1 }, {});
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roomTypes.update', 'settings.manage'] });
        return accessPermittedRoomTypesView({ id: 1 }, {});
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for server detail view returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermittedServerView({ id: 1 }, { view: '1' }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['servers.view'] });
        return accessPermittedServerView({ id: 1 }, { view: '1' });
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['servers.view', 'settings.manage'] });
        return accessPermittedServerView({ id: 1 }, { view: '1' });
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for server new view returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermittedServerView({ id: 'new' }, {}).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['servers.create'] });
        return accessPermittedServerView({ id: 'new' }, {});
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['servers.create', 'settings.manage'] });
        return accessPermittedServerView({ id: 'new' }, {});
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for server update returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermittedServerView({ id: 1 }, {}).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['servers.update'] });
        return accessPermittedServerView({ id: 1 }, {});
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['servers.update', 'settings.manage'] });
        return accessPermittedServerView({ id: 1 }, {});
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for server pool detail view returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermittedServerPoolView({ id: 1 }, { view: '1' }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['serverPools.view'] });
        return accessPermittedServerPoolView({ id: 1 }, { view: '1' });
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['serverPools.view', 'settings.manage'] });
        return accessPermittedServerPoolView({ id: 1 }, { view: '1' });
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for server pool new view returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermittedServerPoolView({ id: 'new' }, {}).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['serverPools.create'] });
        return accessPermittedServerPoolView({ id: 'new' }, {});
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['serverPools.create', 'settings.manage'] });
        return accessPermittedServerPoolView({ id: 'new' }, {});
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for server pool update returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermittedServerPoolView({ id: 1 }, {}).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['serverPools.update'] });
        return accessPermittedServerPoolView({ id: 1 }, {});
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['serverPools.update', 'settings.manage'] });
        return accessPermittedServerPoolView({ id: 1 }, {});
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });
  });
});
