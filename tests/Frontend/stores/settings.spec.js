import { createPinia, setActivePinia } from 'pinia';
import { axiosMock } from '../helper';
import { useSettingsStore } from '../../../resources/js/stores/settings';

describe('SettingsStore', () => {
  beforeEach(() => {
    axiosMock.reset();
    setActivePinia(createPinia());
  });

  afterEach(() => {

  });

  it('getSettings loads the settings from the server, resolves only after the request is fulfilled and sets the corresponding property', async () => {
    axiosMock.stubRequest('/api/v1/settings', {
      status: 200,
      response: { data: { foo: 'bar' } }
    });

    const settings = useSettingsStore();

    await settings.getSettings();

    expect(settings.settings).toEqual({ foo: 'bar' });
  });
});
