import Session from '../../../resources/js/store/modules/session';
import moxios from 'moxios';
import i18n, { importLanguage } from '../../../resources/js/i18n';
import { overrideStub } from '../helper';

describe('store/session', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('getSettings loads the settings from the server, resolves only after the request is fulfilled and sets the corresponding property', async () => {
    const commit = vi.fn();

    moxios.stubRequest('/api/v1/settings', {
      status: 200,
      response: { data: { foo: 'bar' } }
    });

    await Session.actions.getSettings({ commit });

    expect(commit).toBeCalledTimes(1);
    expect(commit).toBeCalledWith('setSettings', { foo: 'bar' });
  });

  it('getCurrentUser and set i18n timezone', async () => {
    const messagesEN = require('../../../lang/en.json');
    importLanguage('en', messagesEN);

    const commit = vi.fn();

    const user = {
      id: 1,
      authenticator: 'ldap',
      email: 'john.doe@domain.tld',
      username: 'user',
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

    await Session.actions.getCurrentUser({ commit });

    expect(commit).toBeCalledTimes(1);
    expect(commit).toBeCalledWith('setCurrentUser', { currentUser: user });

    expect(i18n.d(new Date('2021-02-12T18:09:29.000000Z'), 'datetimeShort')).toBe('02/13/2021, 05:09');

    user.timezone = 'Europe/Berlin';
    const restoreCurrentUserResponse = overrideStub('/api/v1/currentUser', {
      status: 200,
      response: {
        data: user
      }
    });

    await Session.actions.getCurrentUser({ commit });

    expect(commit).toBeCalledTimes(2);
    expect(commit).toHaveBeenLastCalledWith('setCurrentUser', { currentUser: user });

    expect(i18n.d(new Date('2021-02-12T18:09:29.000000Z'), 'datetimeShort')).toBe('02/12/2021, 19:09');
    restoreCurrentUserResponse();
  });
});
