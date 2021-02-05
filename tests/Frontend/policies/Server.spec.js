import ServerPolicy from '../../../resources/js/policies/ServerPolicy';

describe('ServerPolicy', function () {
  it('viewAny returns true if the user has the permission to view any servers', function () {
    expect(ServerPolicy.viewAny({ currentUser: { permissions: [] } })).toBe(false);
    expect(ServerPolicy.viewAny({ currentUser: { permissions: ['servers.viewAny'] } })).toBe(true);
  });

  it('view returns true if the user has the permission to view servers', function () {
    expect(ServerPolicy.view({ currentUser: { permissions: [] } })).toBe(false);
    expect(ServerPolicy.view({ currentUser: { permissions: ['servers.view'] } })).toBe(true);
  });

  it('update returns true if the user has the permission to update servers', function () {
    expect(ServerPolicy.update({ currentUser: { permissions: [] } })).toBe(false);
    expect(ServerPolicy.update({ currentUser: { permissions: ['servers.update'] } })).toBe(true);
  });

  it('create returns true if the user has the permission to create servers', function () {
    expect(ServerPolicy.create({ currentUser: { permissions: [] } })).toBe(false);
    expect(ServerPolicy.create({ currentUser: { permissions: ['servers.create'] } })).toBe(true);
  });

  it('delete returns true if the user has the permission to delete servers', function () {
    expect(ServerPolicy.delete({ currentUser: { permissions: [] } })).toBe(false);
    expect(ServerPolicy.delete({ currentUser: { permissions: ['servers.delete'] } })).toBe(true);
  });
});
