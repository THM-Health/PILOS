import SettingPolicy from '../../../resources/js/policies/SettingPolicy';

describe('SettingPolicy', function () {
  it('manage returns true if the user has the permission to manage settings', function () {
    expect(SettingPolicy.manage({ currentUser: { permissions: [] } })).toBe(false);
    expect(SettingPolicy.manage({ currentUser: { permissions: ['settings.manage'] } })).toBe(true);
  });
});
