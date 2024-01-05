/* eslint-disable @intlify/vue-i18n/no-missing-keys */
import i18n from '@/i18n';
import { mockAxios } from '../helper';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import PermissionService from '@/services/PermissionService';

describe('Auth Store', () => {
  beforeEach(() => {
    mockAxios.reset();
    setActivePinia(createPinia());
  });

  afterEach(() => {

  });

  it('getCurrentUser and set locale and timezone', async () => {
    const PermissionServiceSpy = vi.spyOn(PermissionService, 'setCurrentUser').mockImplementation(() => {});

    const user = {
      id: 1,
      authenticator: 'ldap',
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

    mockAxios.request('/api/v1/currentUser').respondWith({
      status: 200,
      data: {
        data: user
      }
    });

    mockAxios.request('/api/v1/locale/en').respondWith({
      status: 200,
      data: {
        data: {
          app: {
            demo: 'This is a test'
          }
        },
        meta: {
          dateTimeFormat: {
            datetimeShort: {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }
          },
          name: 'English'
        }
      }
    });

    const auth = useAuthStore();
    await auth.getCurrentUser();

    expect(auth.currentUser).toEqual(user);
    expect(PermissionServiceSpy).toBeCalledTimes(1);
    expect(PermissionServiceSpy).toBeCalledWith(user, true);

    mockAxios.request('/api/v1/currentUser').respondWith({
      status: 200,
      data: {
        data: user
      }
    });

    await auth.getCurrentUser();

    expect(auth.currentUser).toEqual(user);
    expect(PermissionServiceSpy).toBeCalledTimes(2);
    expect(PermissionServiceSpy).toBeCalledWith(user, true);

    expect(i18n.d(new Date('2021-02-12T18:09:29.000000Z'), 'datetimeShort')).toBe('02/13/2021, 05:09');
    expect(i18n.t('app.demo', { value: 'test' })).toEqual('This is a test');
  });

  it('logout', async () => {
    const auth = useAuthStore();
    auth.currentUser = {
      id: 1,
      authenticator: 'ldap',
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

    const request = mockAxios.request('/api/v1/logout');

    auth.logout();

    await request.wait();

    expect(request.config.method).toEqual('post');
    expect(request.config.url).toEqual('/api/v1/logout');

    await request.respondWith({
      status: 204
    });

    expect(auth.currentUser).toBeNull();
  });
});
