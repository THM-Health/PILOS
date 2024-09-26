/**
 * Policy for room actions
 */
export default {

  /**
   * Is user allowed to create new rooms
   * @param user
   * @return {boolean}
   */
  create (user) {
    return !user ? false : user.permissions.includes('rooms.create');
  },

  /**
   * Is user allowed to see all rooms
   * @param user
   * @return {boolean}
   */
  viewAll (user) {
    return !user ? false : user.permissions.includes('rooms.viewAll');
  },

  /**
   * Is user allowed to see the invitation text (includes access code)
   * @param user
   * @param model
   * @return {boolean}
   */
  viewInvitation (user, model) {
    return !user ? false : model.owner.id === user.id || model.is_moderator || model.is_co_owner || user.permissions.includes('rooms.viewAll');
  },

  /**
   * Is user allowed to delete this room
   * @param user
   * @param model
   * @return {boolean}
   */
  delete (user, model) {
    return !user ? false : model.owner.id === user.id || user.permissions.includes('rooms.manage');
  },
  /**
   * Is user allowed to transfer this room to a different user
   * @param user
   * @param model
   * @return {boolean}
   */
  transfer (user, model) {
    return !user ? false : model.owner.id === user.id || user.permissions.includes('rooms.manage');
  },

  /**
   * Is user allowed to see all room settings (including files and members)
   * @param user
   * @param model
   * @return {boolean}
   */
  viewSettings (user, model) {
    return !user ? false : model.owner.id === user.id || model.is_co_owner || user.permissions.includes('rooms.viewAll');
  },

  /**
   * Is user allowed to change all room settings (including files and members)
   * @param user
   * @param model
   * @return {boolean}
   */
  manageSettings (user, model) {
    return !user ? false : model.owner.id === user.id || model.is_co_owner || user.permissions.includes('rooms.manage');
  },

  /**
   * Is user allowed to become member of this room
   * @param user
   * @param model
   */
  becomeMember (user, model) {
    return !user ? false : model.allow_membership && !model.is_member && model.owner.id !== user.id;
  }

};
