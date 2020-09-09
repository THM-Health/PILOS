import { beforeEachRoute } from '../../resources/js/router';

describe('Router', function () {
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
});
