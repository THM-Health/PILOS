import ApplicationSettingPolicy from '../../../resources/js/policies/ApplicationSettingPolicy';

describe('ApplicationSettingPolicy', () => {
  it('viewAny returns true if the user has the permission to view all settings', async () => {
    expect(ApplicationSettingPolicy.viewAny({ currentUser: { permissions: [] } })).toBe(false);
    expect(ApplicationSettingPolicy.viewAny({ currentUser: { permissions: ['applicationSettings.viewAny'] } })).toBe(true);
  });

  it('update returns true if the user has the permission to update settings', async () => {
    expect(ApplicationSettingPolicy.update({ currentUser: { permissions: [] } })).toBe(false);
    expect(ApplicationSettingPolicy.update({ currentUser: { permissions: ['applicationSettings.update'] } })).toBe(true);
  });
});
