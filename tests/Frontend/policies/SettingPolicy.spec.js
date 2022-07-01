import SettingPolicy from '../../../resources/js/policies/SettingPolicy';

describe('SettingPolicy', () => {
  it('manage returns true if the user has the permission to manage settings', async () => {
    expect(SettingPolicy.manage({ currentUser: { permissions: [] } })).toBe(false);
    expect(SettingPolicy.manage({ currentUser: { permissions: ['settings.manage'] } })).toBe(true);
  });
});
