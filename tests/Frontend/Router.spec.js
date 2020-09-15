import { beforeEachRoute, routes } from '../../resources/js/router';
import PermissionService from '../../resources/js/services/PermissionService';
import moxios from 'moxios';
import sinon from 'sinon';
import Vue from 'vue';
import Base from '../../resources/js/api/base';

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
    const accessPermitted = routes.filter(route => route.path === '/settings')[0]
      .children.filter(route => route.name === 'settings.roles.view')[0].meta.accessPermitted;

    it('for role detail view returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermitted({ id: 1 }, { view: '1' }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roles.view'] });
        return accessPermitted({ id: 1 }, { view: '1' });
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roles.view', 'settings.manage'] });
        return accessPermitted({ id: 1 }, { view: '1' });
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for role new view returns true if user has the necessary permissions', function (done) {
      const oldUser = PermissionService.currentUser;

      accessPermitted({ id: 'new' }, {}).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roles.create'] });
        return accessPermitted({ id: 'new' }, {});
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roles.create', 'settings.manage'] });
        return accessPermitted({ id: 'new' }, {});
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for role update view returns true if user has necessary permissions and role is not a default role', function (done) {
      const oldUser = PermissionService.currentUser;
      const respond = function () {
        let request = moxios.requests.mostRecent()
        request.respondWith({
          status: 200,
          response: {
            data: {
              id: 1,
              default: true,
              modelName: 'Role'
            }
          }
        });
      };

      moxios.wait(respond);

      accessPermitted({ id: 1 }, {}).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roles.update'] });
        moxios.wait(respond);

        return accessPermitted({ id: 1 }, {});
      }).then(result => {
        expect(result).toBe(false);

        PermissionService.setCurrentUser({ permissions: ['roles.update', 'settings.manage'] });
        moxios.wait(respond);

        return accessPermitted({ id: 1 }, {});
      }).then(result => {
        expect(result).toBe(false);

        moxios.wait(function () {
          let request = moxios.requests.mostRecent()
          return request.respondWith({
            status: 200,
            response: {
              data: {
                id: 1,
                default: false,
                modelName: 'Role'
              }
            }
          });
        });

        return accessPermitted({ id: 1 }, {});
      }).then(result => {
        expect(result).toBe(true);

        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });

    it('for role update view calls error handler returns false on error in request', function (done) {
      let spy = sinon.spy();
      sinon.stub(Base, 'error').callsFake(spy);

      moxios.wait(function () {
        let request = moxios.requests.mostRecent()
        request.respondWith({
          status: 500,
          response: {
            message: 'Test'
          }
        });
      });

      accessPermitted({ id: 1 }, {}).then(result => {
        expect(result).toBe(false);
        sinon.assert.calledOnce(Base.error);
        Base.error.restore();
        done();
      });
    });
  });
});
