import { createPinia, setActivePinia } from 'pinia';
import { mockAxios } from '../helper';
import { useSettingsStore } from '@/stores/settings';

describe('SettingsStore', () => {
  beforeEach(() => {
    mockAxios.reset();
    setActivePinia(createPinia());
  });

  afterEach(() => {

  });

  it('getSettings loads the settings from the server, resolves only after the request is fulfilled and sets the corresponding property', async () => {
    mockAxios.request('/api/v1/settings').respondWith({
      status: 200,
      data: { data: { foo: 'bar' } }
    });

    const settings = useSettingsStore();

    await settings.getSettings();

    expect(settings.settings).toEqual({ foo: 'bar' });
  });
});
