import ServerPoolPolicy from '../../../resources/js/policies/ServerPoolPolicy';

describe('ServerPoolPolicy', function () {
  it('viewAny returns true if the user has the permission to view any Server Pools', function () {
    expect(ServerPoolPolicy.viewAny({ currentUser: { permissions: [] } })).toBe(false);
    expect(ServerPoolPolicy.viewAny({ currentUser: { permissions: ['serverPools.viewAny'] } })).toBe(true);
  });

  it('view returns true if the user has the permission to view server pool', function () {
    expect(ServerPoolPolicy.view({ currentUser: { permissions: [] } })).toBe(false);
    expect(ServerPoolPolicy.view({ currentUser: { permissions: ['serverPools.view'] } })).toBe(true);
  });

  it('update returns true if the user has the permission to update server pool', function () {
    expect(ServerPoolPolicy.update({ currentUser: { permissions: [] } })).toBe(false);
    expect(ServerPoolPolicy.update({ currentUser: { permissions: ['serverPools.update'] } })).toBe(true);
  });

  it('create returns true if the user has the permission to create server pool', function () {
    expect(ServerPoolPolicy.create({ currentUser: { permissions: [] } })).toBe(false);
    expect(ServerPoolPolicy.create({ currentUser: { permissions: ['serverPools.create'] } })).toBe(true);
  });

  it('delete returns true if the user has the permission to delete server pool', function () {
    expect(ServerPoolPolicy.delete({ currentUser: { permissions: [] } })).toBe(false);
    expect(ServerPoolPolicy.delete({ currentUser: { permissions: ['serverPools.delete'] } })).toBe(true);
  });
});
