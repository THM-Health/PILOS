import Base from '../../../resources/js/api/base';
import moxios from 'moxios';
import sinon from 'sinon';
import VueRouter from 'vue-router';

let consoleErrorStub;

describe('base', function () {
  beforeEach(function () {
    moxios.install();
    consoleErrorStub = sinon.stub(console, 'error');
  });

  afterEach(function () {
    moxios.uninstall();
    consoleErrorStub.restore();
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

  it('base error handling', function () {
    const flashMessageErrorSpy = sinon.spy();
    const flashMessageInfoSpy = sinon.spy();
    const flashMessage = {
      info (param) {
        flashMessageInfoSpy(param);
      },
      error (param) {
        flashMessageErrorSpy(param);
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
      $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')

    };

    // 401 errors
    let error = { response: { data: { message: 'Unauthenticated.' }, status: 401, statusText: 'Unauthorized' }, message: 'Request failed with status code 401' };
    Base.error(error, vm, error.message);
    sinon.assert.calledOnceWithExactly(routerSpy, { name: 'login', query: { redirect: '/test' } });
    sinon.assert.calledOnceWithExactly(flashMessageInfoSpy, 'app.flash.unauthenticated');
    sinon.assert.calledOnceWithExactly(storeCommitSpy, 'setCurrentUser', { currentUser: null, emit: false });
    routerSpy.resetHistory();
    flashMessageInfoSpy.resetHistory();
    storeCommitSpy.resetHistory();

    // 403 errors
    error = { response: { data: { message: 'This action is unauthorized.' }, status: 403, statusText: 'Forbidden' }, message: 'Request failed with status code 403' };
    Base.error(error, vm, error.message);
    sinon.assert.calledOnceWithExactly(flashMessageErrorSpy, 'app.flash.unauthorized');
    flashMessageErrorSpy.resetHistory();

    // 420 errors
    error = { response: { data: { message: 'Guests only.' }, status: 420, statusText: 'Guests only' }, message: 'Request failed with status code 420' };
    Base.error(error, vm, error.message);
    sinon.assert.calledOnceWithExactly(flashMessageInfoSpy, 'app.flash.guestsOnly');
    sinon.assert.calledOnceWithExactly(routerSpy, { name: 'home' });
    flashMessageInfoSpy.resetHistory();
    routerSpy.resetHistory();

    // 413 errors
    error = { response: { data: { message: '' }, status: 413, statusText: 'Payload Too Large' }, message: 'Request failed with status code 413' };
    Base.error(error, vm, error.message);
    sinon.assert.calledOnceWithExactly(flashMessageErrorSpy, 'app.flash.tooLarge');
    flashMessageErrorSpy.resetHistory();

    // other server errors with message
    error = { response: { data: { message: 'syntax error' }, status: 500, statusText: 'Internal Server Error' }, message: 'Request failed with status code 500' };
    Base.error(error, vm, error.message);
    sinon.assert.calledOnceWithExactly(flashMessageErrorSpy, {
      contentClass: 'flash_small_title flex-column-reverse d-flex',
      message: 'app.flash.serverError.message:{"message":"syntax error"}',
      title: 'app.flash.serverError.title:{"statusCode":500}'
    });
    flashMessageErrorSpy.resetHistory();

    // other server errors without message
    error = { response: { data: { message: '' }, status: 500, statusText: 'Internal Server Error' }, message: 'Request failed with status code 500' };
    Base.error(error, vm, error.message);
    sinon.assert.calledOnceWithExactly(flashMessageErrorSpy, {
      contentClass: 'flash_small_title flex-column-reverse d-flex',
      message: 'app.flash.serverError.emptyMessage',
      title: 'app.flash.serverError.title:{"statusCode":500}'
    });
    flashMessageErrorSpy.resetHistory();

    // other non server error
    Base.error(new Error(JSON.stringify({ testProp1: 'testValue1', testProp2: 'testValue2' })), vm, 'infoText');
    sinon.assert.calledOnceWithExactly(flashMessageErrorSpy, 'app.flash.clientError');
    sinon.assert.calledOnceWithExactly(consoleErrorStub, 'Error: Error: {"testProp1":"testValue1","testProp2":"testValue2"}\nInfo: infoText');
    consoleErrorStub.resetHistory();
    flashMessageErrorSpy.resetHistory();
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
