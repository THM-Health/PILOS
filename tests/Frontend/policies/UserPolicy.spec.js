import UserPolicy from '../../../resources/js/policies/UserPolicy';

describe('UserPolicy', function () {
  it('viewAny returns true if the user has the permission to view all users', function () {
    expect(UserPolicy.viewAny({ currentUser: { permissions: [] } })).toBe(false);
    expect(UserPolicy.viewAny({ currentUser: { permissions: ['users.viewAny'] } })).toBe(true);
  });
});
