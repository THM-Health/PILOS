import ApplicationSettingPolicy from '../../../resources/js/policies/ApplicationSettingPolicy';

describe('ApplicationSettingPolicy', function () {
  it('viewAny returns true if the user has the permission to view all settings', function () {
    expect(ApplicationSettingPolicy.viewAny({ currentUser: { permissions: [] } })).toBe(false);
    expect(ApplicationSettingPolicy.viewAny({ currentUser: { permissions: ['applicationSettings.viewAny'] } })).toBe(true);
  });

  it('update returns true if the user has the permission to update settings', function () {
    expect(ApplicationSettingPolicy.update({ currentUser: { permissions: [] } })).toBe(false);
    expect(ApplicationSettingPolicy.update({ currentUser: { permissions: ['applicationSettings.update'] } })).toBe(true);
  });
});
