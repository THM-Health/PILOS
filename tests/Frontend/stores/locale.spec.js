import i18n, { setTimeZone } from '../../../resources/js/i18n';
import * as i18nModule from '../../../resources/js/i18n';
import { mockAxios } from '../helper';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '../../../resources/js/stores/auth';
import { useLocaleStore } from '../../../resources/js/stores/locale';
import Base from '../../../resources/js/api/base';
import { expect } from 'vitest';

describe('Locale Store', () => {
  beforeEach(() => {
    mockAxios.reset();
    setActivePinia(createPinia());
  });

  afterEach(() => {

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

    // call setCurrentLocale
    await localeStore.setCurrentLocale('fr');

    // check if i18n locale is set to fr
    expect(i18n.locale).toEqual('fr');

    // call setCurrentLocale
    await localeStore.setCurrentLocale('en');

    // check if i18n locale is set to en
    expect(i18n.locale).toEqual('en');
  });

  it('set timezone', async () => {
    const localeStore = useLocaleStore();

    // Set locale and timezone
    await localeStore.setCurrentLocale('en');
    await setTimeZone('Europe/Berlin');

    // Check if date is converted
    expect(i18n.d(new Date('2021-02-12T18:09:29.000000Z'), 'datetimeShort')).toBe('02/12/2021, 19:09');

    // Set timezone to Australia/Sydney
    await localeStore.setTimezone('Australia/Sydney');

    // Check if date is converted
    expect(i18n.d(new Date('2021-02-12T18:09:29.000000Z'), 'datetimeShort')).toBe('02/13/2021, 05:09');
  });

  it('load available locales', async () => {
    // Mock getLocaleList implementation
    vi.spyOn(i18nModule, 'getLocaleList').mockImplementation(() => {
      return {
        de: 'German',
        en: 'English',
        ru: 'Russian'
      };
    });

    const localeStore = useLocaleStore();

    // Call loadAvailableLocales
    localeStore.loadAvailableLocales();

    // Check if availableLocales is set
    expect(localeStore.availableLocales).toEqual({
      de: 'German',
      en: 'English',
      ru: 'Russian'
    });
  });
});
