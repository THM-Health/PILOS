import { mockAxios } from '../helper';
import { createPinia, setActivePinia } from 'pinia';
import { useLoadingStore } from '../../../resources/js/stores/loading';
import { useSettingsStore } from '../../../resources/js/stores/settings';
import { useAuthStore } from '../../../resources/js/stores/auth';

describe('Loading Store', () => {
  beforeEach(() => {
    mockAxios.reset();
    setActivePinia(createPinia());
  });

  afterEach(() => {

  });

  it('initialize', async () => {
    const loadingStore = useLoadingStore();
    const settingsStore = useSettingsStore();
    const authStore = useAuthStore();

    const loadSettingsSpy = vi.spyOn(settingsStore, 'getSettings').mockImplementation(() => {});
    const loadCurrentUserSpy = vi.spyOn(authStore, 'getCurrentUser').mockImplementation(() => {});

    await loadingStore.initialize();

    expect(loadSettingsSpy).toHaveBeenCalled();
    expect(loadCurrentUserSpy).toHaveBeenCalled();

    expect(loadingStore.initialized).toBe(true);
  });
});
