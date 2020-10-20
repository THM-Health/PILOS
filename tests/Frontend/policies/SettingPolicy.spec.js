import SettingPolicy from '../../../resources/js/policies/SettingPolicy';

describe('SettingPolicy', function () {
  it('manage returns true if the user has the permission to manage settings', function () {
    expect(SettingPolicy.manage({ currentUser: { permissions: [] } })).toBe(false);
    expect(SettingPolicy.manage({ currentUser: { permissions: ['settings.manage'] } })).toBe(true);
  });

  it('viewAny returns true if the user has the permission to view all settings', function () {
    expect(SettingPolicy.viewAny({ currentUser: { permissions: [] } })).toBe(false);
    expect(SettingPolicy.viewAny({ currentUser: { permissions: ['settings.viewAny'] } })).toBe(true);
  });

  it('update returns true if the user has the permission to update settings', function () {
    expect(SettingPolicy.update({ currentUser: { permissions: [] } })).toBe(false);
    expect(SettingPolicy.update({ currentUser: { permissions: ['settings.update'] } })).toBe(true);
  });
});
