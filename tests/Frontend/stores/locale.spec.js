/* eslint-disable @intlify/vue-i18n/no-missing-keys */
import i18n from '../../../resources/js/i18n';
import { mockAxios } from '../helper';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '../../../resources/js/stores/auth';
import { useLocaleStore } from '../../../resources/js/stores/locale';
import Base from '../../../resources/js/api/base';
import { expect } from 'vitest';

const enLocale = {
  data: {
    app: {
      demo: 'This is a :value'
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
};

const deLocale = {
  data: {
    app: {
      demo: 'Dies ist ein :value'
    }
  },
  meta: {
    dateTimeFormat: {
      datetimeShort: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }
    },
    name: 'Deutsch'
  }
};

describe('Locale Store', () => {
  beforeEach(() => {
    mockAxios.reset();
    setActivePinia(createPinia());
  });

  it('set locale', async () => {
    const localeStore = useLocaleStore();
    const authStore = useAuthStore();

    const baseSpy = vi.spyOn(Base, 'setLocale').mockImplementation(() => {});
    const authSpy = vi.spyOn(authStore, 'getCurrentUser').mockImplementation(() => {});
    const setLocaleSpy = vi.spyOn(localeStore, 'setCurrentLocale').mockImplementation(() => {});

    // Call setLocale
    await localeStore.setLocale('en');

    // Check if methode to change locale on the backend was called
    expect(baseSpy).toHaveBeenCalledTimes(1);
    expect(baseSpy).toHaveBeenCalledWith('en');

    // Check if authStore.getCurrentUser was called (to update the user object)
    expect(authSpy).toHaveBeenCalledTimes(1);

    // Check if localeStore.setCurrentLocale was called (to update the locale)
    expect(setLocaleSpy).toHaveBeenCalledTimes(1);
    expect(setLocaleSpy).toHaveBeenCalledWith('en');
  });

  it('set current locale', async () => {
    const localeStore = useLocaleStore();

    mockAxios.request('/api/v1/locale/en').respondWith({
      status: 200,
      data: enLocale
    });

    mockAxios.request('/api/v1/locale/de').respondWith({
      status: 200,
      data: deLocale
    });

    // call setCurrentLocale
    await localeStore.setCurrentLocale('en');

    // check i18n locale
    expect(i18n.locale).toEqual('en');

    // check i18n message with placeholder
    expect(i18n.t('app.demo', { value: 'test' })).toEqual('This is a test');

    // change locale
    await localeStore.setCurrentLocale('de');

    // check i18n locale
    expect(i18n.locale).toEqual('de');

    // check i18n message with placeholder
    expect(i18n.t('app.demo', { value: 'Test' })).toEqual('Dies ist ein Test');

    // change locale back to en and check if translation isn't reloaded from backend
    await localeStore.setCurrentLocale('en');
    expect(i18n.locale).toEqual('en');
    expect(mockAxios.history().get.length).toBe(2);
  });

  it('set timezone', async () => {
    const localeStore = useLocaleStore();

    mockAxios.request('/api/v1/locale/en').respondWith({
      status: 200,
      data: enLocale
    });

    mockAxios.request('/api/v1/locale/de').respondWith({
      status: 200,
      data: deLocale
    });

    // Set locale and timezone
    await localeStore.setCurrentLocale('en');
    await localeStore.setTimezone('Europe/Berlin');

    // Check if date is converted
    expect(i18n.d(new Date('2021-02-12T18:09:29.000000Z'), 'datetimeShort')).toBe('02/12/2021, 19:09');

    // Set timezone to Australia/Sydney
    await localeStore.setTimezone('Australia/Sydney');

    // Check if date is converted
    expect(i18n.d(new Date('2021-02-12T18:09:29.000000Z'), 'datetimeShort')).toBe('02/13/2021, 05:09');

    // Change locale
    await localeStore.setCurrentLocale('de');

    // check if timezone is still Australia/Sydney
    expect(i18n.d(new Date('2021-02-12T18:09:29.000000Z'), 'datetimeShort')).toBe('13.02.2021, 05:09');
  });
});
