import Base from '../../../resources/js/api/base';
import moxios from 'moxios';
import sinon from 'sinon';
import VueRouter from 'vue-router';

describe('base', function () {
  beforeEach(function () {
    moxios.install();
  });

  afterEach(function () {
    moxios.uninstall();
  });

  describe('call', function () {
    it('calls `getCsrfCookie` if `loadCsrfCookie` is set to true', function (done) {
      moxios.stubRequest('/api/v1/test', {
        status: 200,
        responseText: 'Test'
      });

      const spy = sinon.spy(() => Promise.resolve());
      sinon.stub(Base, 'getCsrfCookie').callsFake(spy);

      Base.call('test', {}, true).then(() => {
        sinon.assert.calledOnce(spy);
        Base.getCsrfCookie.restore();
        done();
      });
    });

    it('makes an call to the passed route with the passed parameters', function (done) {
      Base.call('test', { method: 'put', data: { a: 'test' } });

      moxios.wait(function () {
        const request = moxios.requests.mostRecent();

        expect(request.config.url).toBe('/api/v1/test');
        expect(request.config.method).toBe('put');
        expect(request.config.data).toBe('{"a":"test"}');

        request.respondWith({
          status: 200
        })
          .then(function () {
            done();
          });
      });
    });

    it('returns a promise that rejects on response codes above 400', function (done) {
      moxios.stubRequest('/api/v1/test', {
        status: 400,
        responseText: 'Test'
      });

      Base.call('test').catch((error) => {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toBe('Test');
        done();
      });
    });
  });

  it('base error handling 401', function () {
    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      info (param) {
        flashMessageSpy(param);
      }
    };

    const routerSpy = sinon.spy();
    const router = new VueRouter();
    router.replace = routerSpy;
    const sandbox = sinon.createSandbox();
    sandbox.replaceGetter(router, 'currentRoute', function () {
      return { path: '/test' };
    });

    const storeCommitSpy = sinon.spy();
    const store = {
      getters: {
        'session/isAuthenticated': true
      },
      commit: storeCommitSpy
    };

    const vm = {
      $store: store,
      $router: router,
      flashMessage: flashMessage,
      $t: (key) => key

    };

    const error = { response: { data: { message: 'Unauthenticated.' }, status: 401, statusText: 'Unauthorized' }, message: 'Request failed with status code 401' };
    Base.error(error, vm, error.message);

    sinon.assert.calledOnce(routerSpy);
    sinon.assert.calledWith(routerSpy, { name: 'login', query: { redirect: '/test' } });

    sinon.assert.calledOnce(flashMessageSpy);
    sinon.assert.calledWith(flashMessageSpy, 'app.flash.unauthenticated');

    sinon.assert.calledOnce(storeCommitSpy);
    sinon.assert.calledWith(storeCommitSpy, 'setCurrentUser', { currentUser: null, emit: false });
  });

  it('`getCsrfCookie` calls the route for getting a csrf cookie', function (done) {
    moxios.stubRequest('/sanctum/csrf-cookie', {
      status: 200,
      responseText: 'Test'
    });

    Base.getCsrfCookie().then((response) => {
      expect(response.status).toBe(200);
      expect(response.data).toBe('Test');

      done();
    });
  });

  it('`setLocale` calls `call` with the corresponding locale', function () {
    const spy = sinon.spy();
    sinon.stub(Base, 'call').callsFake(spy);

    Base.setLocale('de');
    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, 'setLocale', { data: { locale: 'de' }, method: 'post' });
    Base.call.restore();
  });
});
