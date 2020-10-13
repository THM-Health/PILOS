import UserPolicy from '../../../resources/js/policies/UserPolicy';

describe('UserPolicy', function () {
  it('viewAny returns true if the user has the permission to view all users', function () {
    expect(UserPolicy.viewAny({ currentUser: { permissions: [] } })).toBe(false);
    expect(UserPolicy.viewAny({ currentUser: { permissions: ['users.viewAny'] } })).toBe(true);
  });

  it('view returns true if the user has permission to view users or the user model to view is the own user', function () {
    expect(UserPolicy.view({ currentUser: { permissions: [], id: 1 } }, { id: 1337, model_name: 'User' })).toBe(false);
    expect(UserPolicy.view({ currentUser: { permissions: [], id: 1 } }, { id: 1, model_name: 'User' })).toBe(true);
    expect(UserPolicy.view({ currentUser: { permissions: ['users.view'], id: 1 } }, { id: 1337, model_name: 'User' })).toBe(true);
  });

  it('view returns true if the user has permission to create users', function () {
    expect(UserPolicy.create({ currentUser: { permissions: [], id: 1 } })).toBe(false);
    expect(UserPolicy.create({ currentUser: { permissions: ['users.create'], id: 1 } })).toBe(true);
  });

  it('update returns true if the user has permission to update users or the user model to update is the own user', function () {
    expect(UserPolicy.update({ currentUser: { permissions: [], id: 1 } }, { id: 1337, model_name: 'User' })).toBe(false);
    expect(UserPolicy.update({ currentUser: { permissions: [], id: 1 } }, { id: 1, model_name: 'User' })).toBe(true);
    expect(UserPolicy.update({ currentUser: { permissions: ['users.update'], id: 1 } }, { id: 1337, model_name: 'User' })).toBe(true);
  });

  it('delete returns true if the user has permission to delete users and the user model to delete is not the own user', function () {
    expect(UserPolicy.delete({ currentUser: { permissions: [], id: 1 } }, { id: 1337, model_name: 'User' })).toBe(false);
    expect(UserPolicy.delete({ currentUser: { permissions: [], id: 1 } }, { id: 1, model_name: 'User' })).toBe(false);
    expect(UserPolicy.delete({ currentUser: { permissions: ['users.delete'], id: 1 } }, { id: 1, model_name: 'User' })).toBe(false);
    expect(UserPolicy.delete({ currentUser: { permissions: ['users.delete'], id: 1 } }, { id: 1337, model_name: 'User' })).toBe(true);
  });

  it('editUserRole returns true if the user has permission to update users and the user model to update is not the own user', function () {
    expect(UserPolicy.editUserRole({ currentUser: { permissions: [], id: 1 } }, { id: 1337, model_name: 'User' })).toBe(false);
    expect(UserPolicy.editUserRole({ currentUser: { permissions: [], id: 1 } }, { id: 1, model_name: 'User' })).toBe(false);
    expect(UserPolicy.editUserRole({ currentUser: { permissions: ['users.update'], id: 1 } }, { id: 1, model_name: 'User' })).toBe(false);
    expect(UserPolicy.editUserRole({ currentUser: { permissions: ['users.update'], id: 1 } }, { id: 1337, model_name: 'User' })).toBe(true);
  });
});
