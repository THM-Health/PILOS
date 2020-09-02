import RolePolicy from '../../../resources/js/policies/RolePolicy';

describe('RolePolicy', function () {
  it('viewAny returns true if the user has the permission to view all roles', function () {
    expect(RolePolicy.viewAny({ currentUser: { permissions: [] } })).toBe(false);
    expect(RolePolicy.viewAny({ currentUser: { permissions: ['roles.viewAny'] } })).toBe(true);
  });
});
