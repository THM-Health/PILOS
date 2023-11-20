import RoomPolicy from '@/policies/RoomPolicy';

describe('RoomPolicy', () => {
  it('viewAll returns returns if the user has the permission to view all rooms', async () => {
    expect(RoomPolicy.viewAll({ currentUser: { permissions: [] } })).toBe(false);
    expect(RoomPolicy.viewAll({ currentUser: { permissions: ['rooms.viewAll'] } })).toBe(true);
  });

  it('create returns true if the user has the permission to create rooms', async () => {
    expect(RoomPolicy.create({ currentUser: { permissions: [] } })).toBe(false);
    expect(RoomPolicy.create({ currentUser: { permissions: ['rooms.create'] } })).toBe(true);
  });

  it('view invitation returns true if the user is the owner, co-owner, moderator or has the viewAll permission', async () => {
    expect(RoomPolicy.viewInvitation({ currentUser: { permissions: [], id: 2 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: false })).toBe(false);
    expect(RoomPolicy.viewInvitation({ currentUser: { permissions: [], id: 1 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: false })).toBe(true);
    expect(RoomPolicy.viewInvitation({ currentUser: { permissions: [], id: 2 } }, { owner: { id: 1 }, is_moderator: true, is_co_owner: false })).toBe(true);
    expect(RoomPolicy.viewInvitation({ currentUser: { permissions: [], id: 2 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: true })).toBe(true);
    expect(RoomPolicy.viewInvitation({ currentUser: { permissions: ['rooms.viewAll'], id: 2 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: false })).toBe(true);
  });

  it('delete returns true if the user is the owner or has mange room permission', async () => {
    expect(RoomPolicy.delete({ currentUser: { permissions: [], id: 2 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: false })).toBe(false);
    expect(RoomPolicy.delete({ currentUser: { permissions: [], id: 2 } }, { owner: { id: 1 }, is_moderator: true, is_co_owner: false })).toBe(false);
    expect(RoomPolicy.delete({ currentUser: { permissions: [], id: 2 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: true })).toBe(false);
    expect(RoomPolicy.delete({ currentUser: { permissions: ['rooms.viewAll'], id: 2 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: false })).toBe(false);
    expect(RoomPolicy.delete({ currentUser: { permissions: [], id: 1 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: false })).toBe(true);
    expect(RoomPolicy.delete({ currentUser: { permissions: ['rooms.manage'], id: 2 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: false })).toBe(true);
  });

  it('viewSettings returns true if the user is the owner, co-owner or has view all room permission', async () => {
    expect(RoomPolicy.viewSettings({ currentUser: { permissions: [], id: 2 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: false })).toBe(false);
    expect(RoomPolicy.viewSettings({ currentUser: { permissions: [], id: 2 } }, { owner: { id: 1 }, is_moderator: true, is_co_owner: false })).toBe(false);
    expect(RoomPolicy.viewSettings({ currentUser: { permissions: [], id: 1 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: false })).toBe(true);
    expect(RoomPolicy.viewSettings({ currentUser: { permissions: [], id: 2 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: true })).toBe(true);
    expect(RoomPolicy.viewSettings({ currentUser: { permissions: ['rooms.viewAll'], id: 2 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: false })).toBe(true);
  });

  it('manageSettings returns true if the user is the owner, co-owner or has manage room permission', async () => {
    expect(RoomPolicy.manageSettings({ currentUser: { permissions: [], id: 2 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: false })).toBe(false);
    expect(RoomPolicy.manageSettings({ currentUser: { permissions: [], id: 2 } }, { owner: { id: 1 }, is_moderator: true, is_co_owner: false })).toBe(false);
    expect(RoomPolicy.manageSettings({ currentUser: { permissions: ['rooms.viewAll'], id: 2 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: false })).toBe(false);
    expect(RoomPolicy.manageSettings({ currentUser: { permissions: [], id: 1 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: false })).toBe(true);
    expect(RoomPolicy.manageSettings({ currentUser: { permissions: [], id: 2 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: true })).toBe(true);
    expect(RoomPolicy.manageSettings({ currentUser: { permissions: ['rooms.manage'], id: 2 } }, { owner: { id: 1 }, is_moderator: false, is_co_owner: false })).toBe(true);
  });

  it('becomeMember returns true if the room allows membership, user is not already member of the room and not the owner', async () => {
    expect(RoomPolicy.becomeMember({ currentUser: { permissions: [], id: 1 } }, { owner: { id: 1 }, allow_membership: true, is_member: false })).toBe(false);
    expect(RoomPolicy.becomeMember({ currentUser: { permissions: [], id: 2 } }, { owner: { id: 1 }, allow_membership: true, is_member: true })).toBe(false);
    expect(RoomPolicy.becomeMember({ currentUser: { permissions: [], id: 2 } }, { owner: { id: 1 }, allow_membership: false, is_member: false })).toBe(false);
    expect(RoomPolicy.becomeMember({ currentUser: { permissions: [], id: 2 } }, { owner: { id: 1 }, allow_membership: true, is_member: false })).toBe(true);
  });
});
