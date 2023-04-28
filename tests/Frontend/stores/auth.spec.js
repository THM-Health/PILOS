import moxios from 'moxios';
import i18n from '../../../resources/js/i18n';
import { overrideStub, waitMoxios } from '../helper';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '../../../resources/js/stores/auth';
import PermissionService from '../../../resources/js/services/PermissionService';
import { useLoadingStore } from '../../../resources/js/stores/loading';

describe('Auth Store', () => {
  beforeEach(() => {
    moxios.install();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('getCurrentUser and set i18n timezone', async () => {
    const messagesEn = await import('../../../lang/en.json');
    i18n.setLocaleMessage('en', messagesEn);

    const PermissionServiceSpy = vi.spyOn(PermissionService, 'setCurrentUser').mockImplementation(() => {});

    const user = {
      id: 1,
      authenticator: 'external',
      email: 'john.doe@domain.tld',
      external_id: 'user',
      firstname: 'John',
      lastname: 'Doe',
      user_locale: 'en',
      permissions: [],
      model_name: 'User',
      room_limit: -1,
      timezone: 'Australia/Sydney'
    };

    moxios.stubRequest('/api/v1/currentUser', {
      status: 200,
      response: {
        data: user
      }
    });

    const auth = useAuthStore();
    await auth.getCurrentUser();

    expect(auth.currentUser).toEqual(user);
    expect(PermissionServiceSpy).toBeCalledTimes(1);
    expect(PermissionServiceSpy).toBeCalledWith(user, true);

    expect(i18n.d(new Date('2021-02-12T18:09:29.000000Z'), 'datetimeShort')).toBe('02/13/2021, 05:09');

    user.timezone = 'Europe/Berlin';
    const restoreCurrentUserResponse = overrideStub('/api/v1/currentUser', {
      status: 200,
      response: {
        data: user
      }
    });

    await auth.getCurrentUser();

    expect(auth.currentUser).toEqual(user);
    expect(PermissionServiceSpy).toBeCalledTimes(2);
    expect(PermissionServiceSpy).toBeCalledWith(user, true);

    expect(i18n.d(new Date('2021-02-12T18:09:29.000000Z'), 'datetimeShort')).toBe('02/12/2021, 19:09');
    restoreCurrentUserResponse();
  });

  it('logout', async () => {
    const auth = useAuthStore();
    const loading = useLoadingStore();
    auth.currentUser = {
      id: 1,
      authenticator: 'external',
      email: 'john.doe@domain.tld',
      external_id: 'user',
      firstname: 'John',
      lastname: 'Doe',
      user_locale: 'en',
      permissions: [],
      model_name: 'User',
      room_limit: -1,
      timezone: 'Australia/Sydney'
    };

    auth.logout();
    expect(loading.loadingCounter).toBe(1);

    await waitMoxios();
    const request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('post');
    expect(request.config.url).toEqual('/api/v1/logout');

    await request.respondWith({
      status: 204
    });

    expect(auth.currentUser).toBeNull();
    expect(loading.loadingCounter).toBe(0);
  });
});
