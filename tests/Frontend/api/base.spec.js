import Base from '../../../resources/js/api/base';
import moxios from 'moxios';
import VueRouter from 'vue-router';
import { waitMoxios } from '../helper';
import { createTestingPinia } from '@pinia/testing';
import { useAuthStore } from '../../../resources/js/stores/auth';

let consoleErrorStub;

describe('base', () => {
  beforeEach(() => {
    moxios.install();
    consoleErrorStub = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    moxios.uninstall();
  });

  describe('call', () => {
    it('calls `getCsrfCookie` if `loadCsrfCookie` is set to true', async () => {
      moxios.stubRequest('/api/v1/test', {
        status: 200,
        responseText: 'Test'
      });

      const spy = vi.spyOn(Base, 'getCsrfCookie').mockImplementation(() => Promise.resolve());

      await Base.call('test', {}, true);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('makes an call to the passed route with the passed parameters', async () => {
      Base.call('test', { method: 'put', data: { a: 'test' } });

      await waitMoxios();

      const request = moxios.requests.mostRecent();

      expect(request.config.url).toBe('/api/v1/test');
      expect(request.config.method).toBe('put');
      expect(request.config.data).toBe('{"a":"test"}');

      await request.respondWith({
        status: 200
      });
    });

    it('returns a promise that rejects on response codes above 400', async () => {
      moxios.stubRequest('/api/v1/test', {
        status: 400,
        responseText: 'Test'
      });

      await expect(Base.call('test')).rejects.toMatchObject({
        response: {
          status: 400,
          data: 'Test'
        }
      });
    });

    it('base error handling', async () => {
      const toastErrorSpy = vi.fn();
      const toastInfoSpy = vi.fn();

      const router = new VueRouter();
      const routerSpy = vi.spyOn(router, 'replace').mockImplementation(() => {});
      vi.spyOn(router, 'currentRoute', 'get').mockReturnValue({ path: '/test' });

      const pinia = createTestingPinia();
      const auth = useAuthStore();
      auth.currentUser = { id: 1 };

      const vm = {
        $pinia: pinia,
        $router: router,
        toastInfo: toastInfoSpy,
        toastError: toastErrorSpy,
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')

      };

      // 401 errors
      let error = { response: { data: { message: 'Unauthenticated.' }, status: 401, statusText: 'Unauthorized' }, message: 'Request failed with status code 401' };
      Base.error(error, vm, error.message);

      expect(routerSpy).toBeCalledTimes(1);
      expect(routerSpy).toBeCalledWith({ name: 'login', query: { redirect: '/test' } });

      expect(toastInfoSpy).toBeCalledTimes(1);
      expect(toastInfoSpy).toBeCalledWith('app.flash.unauthenticated');

      expect(auth.setCurrentUser).toBeCalledTimes(1);
      expect(auth.setCurrentUser).toBeCalledWith(null, false);

      vi.clearAllMocks();

      // 403 errors
      error = { response: { data: { message: 'This action is unauthorized.' }, status: 403, statusText: 'Forbidden' }, message: 'Request failed with status code 403' };
      Base.error(error, vm, error.message);
      expect(toastErrorSpy).toBeCalledTimes(1);
      expect(toastErrorSpy).toBeCalledWith('app.flash.unauthorized');
      vi.clearAllMocks();

      // 420 errors
      error = { response: { data: { message: 'Guests only.' }, status: 420, statusText: 'Guests only' }, message: 'Request failed with status code 420' };
      Base.error(error, vm, error.message);
      expect(toastInfoSpy).toBeCalledTimes(1);
      expect(toastInfoSpy).toBeCalledWith('app.flash.guests_only');
      expect(routerSpy).toBeCalledTimes(1);
      expect(routerSpy).toBeCalledWith({ name: 'home' });
      vi.clearAllMocks();

      // 413 errors
      error = { response: { data: { message: '' }, status: 413, statusText: 'Payload Too Large' }, message: 'Request failed with status code 413' };
      Base.error(error, vm, error.message);
      expect(toastErrorSpy).toBeCalledTimes(1);
      expect(toastErrorSpy).toBeCalledWith('app.flash.too_large');
      vi.clearAllMocks();

      // 429 errors
      error = { response: { data: { message: '' }, status: 429, statusText: 'Too Many Requests' }, message: 'Request failed with status code 429' };
      Base.error(error, vm, error.message);
      expect(toastErrorSpy).toBeCalledTimes(1);
      expect(toastErrorSpy).toBeCalledWith('app.flash.too_many_requests');
      vi.clearAllMocks();

      // 503 errors
      const oldWindow = window.location;
      const reloadStub = vi.fn();
      delete window.location;
      window.location = { reload: reloadStub };
      error = { response: { data: { message: '' }, status: 503, statusText: 'Service Unavailable' }, message: 'Request failed with status code 503' };
      Base.error(error, vm, error.message);
      window.location = oldWindow;
      expect(reloadStub).toBeCalledTimes(1);

      // other server errors with message
      error = { response: { data: { message: 'syntax error' }, status: 500, statusText: 'Internal Server Error' }, message: 'Request failed with status code 500' };
      Base.error(error, vm, error.message);
      expect(toastErrorSpy).toBeCalledTimes(1);
      expect(toastErrorSpy).toBeCalledWith(
        'app.flash.server_error.message:{"message":"syntax error"}',
        'app.flash.server_error.error_code:{"statusCode":500}'
      );
      vi.clearAllMocks();

      // other server errors without message
      error = { response: { data: { message: '' }, status: 500, statusText: 'Internal Server Error' }, message: 'Request failed with status code 500' };
      Base.error(error, vm, error.message);
      expect(toastErrorSpy).toBeCalledTimes(1);
      expect(toastErrorSpy).toBeCalledWith(
        'app.flash.server_error.empty_message',
        'app.flash.server_error.error_code:{"statusCode":500}'
      );
      vi.clearAllMocks();

      // other non server error
      Base.error(new Error(JSON.stringify({ testProp1: 'testValue1', testProp2: 'testValue2' })), vm, 'infoText');
      expect(toastErrorSpy).toBeCalledTimes(1);
      expect(toastErrorSpy).toBeCalledWith('app.flash.client_error');
      expect(consoleErrorStub).toBeCalledTimes(1);
      expect(consoleErrorStub).toBeCalledWith('Error: Error: {"testProp1":"testValue1","testProp2":"testValue2"}\nInfo: infoText');
    });

    it('`getCsrfCookie` calls the route for getting a csrf cookie',
      async () => {
        moxios.stubRequest('/sanctum/csrf-cookie', {
          status: 200,
          responseText: 'Test'
        });

        const response = await Base.getCsrfCookie();
        expect(response.status).toBe(200);
        expect(response.data).toBe('Test');
      });

    it('`setLocale` calls `call` with the corresponding locale', async () => {
      const spy = vi.spyOn(Base, 'call').mockImplementation(() => {});

      await Base.setLocale('de');
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith('setLocale', { data: { locale: 'de' }, method: 'post' });
    });
  });
});
