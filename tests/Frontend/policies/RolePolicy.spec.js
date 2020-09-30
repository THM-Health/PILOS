import RolePolicy from '../../../resources/js/policies/RolePolicy';

describe('RolePolicy', function () {
  it('viewAny returns true if the user has the permission to view all roles', function () {
    expect(RolePolicy.viewAny({ currentUser: { permissions: [] } })).toBe(false);
    expect(RolePolicy.viewAny({ currentUser: { permissions: ['roles.viewAny'] } })).toBe(true);
  });

  it('view returns true if the user has the permission to view roles', function () {
    expect(RolePolicy.view({ currentUser: { permissions: [] } })).toBe(false);
    expect(RolePolicy.view({ currentUser: { permissions: ['roles.view'] } })).toBe(true);
  });

  it('create returns true if the user has the permission to create roles', function () {
    expect(RolePolicy.create({ currentUser: { permissions: [] } })).toBe(false);
    expect(RolePolicy.create({ currentUser: { permissions: ['roles.create'] } })).toBe(true);
  });

  it('update returns true if the user has the permission to update roles and the role is not a system default role', function () {
    expect(RolePolicy.update({ currentUser: { permissions: [] } }, { default: true }))
      .toBe(false);
    expect(RolePolicy.update({ currentUser: { permissions: ['roles.update'] } }, { default: true }))
      .toBe(false);
    expect(RolePolicy.update({ currentUser: { permissions: ['roles.update'] } }, { default: false }))
      .toBe(true);
  });

  it('delete returns true if the user has the permission to delete roles and the role is not a system default role', function () {
    expect(RolePolicy.delete({ currentUser: { permissions: [] } }, { default: true }))
      .toBe(false);
    expect(RolePolicy.delete({ currentUser: { permissions: ['roles.delete'] } }, { default: true }))
      .toBe(false);
    expect(RolePolicy.delete({ currentUser: { permissions: ['roles.delete'] } }, { default: false }))
      .toBe(true);
  });
});
