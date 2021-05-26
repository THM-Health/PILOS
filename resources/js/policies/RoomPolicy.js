/**
 * Policy for room actions
 */
export default {

  /**
   * Is user allowed to create new rooms
   * @param permissionService
   * @return {boolean}
   */
  create (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('rooms.create');
  },

  /**
   * Is user allowed to see all rooms
   * @param permissionService
   * @return {boolean}
   */
  viewAll (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('rooms.viewAll');
  },

  /**
   * Is user allowed to see the invitation text (includes access code)
   * @param permissionService
   * @param model
   * @return {boolean}
   */
  viewInvitation (permissionService, model) {
    return !permissionService.currentUser ? false : model.owner.id === permissionService.currentUser.id || model.isModerator || model.isCoOwner || permissionService.currentUser.permissions.includes('rooms.viewAll');
  },

  /**
   * Is user allowed to delete this room
   * @param permissionService
   * @param model
   * @return {boolean}
   */
  delete (permissionService, model) {
    return !permissionService.currentUser ? false : model.owner.id === permissionService.currentUser.id || permissionService.currentUser.permissions.includes('rooms.manage');
  },

  /**
   * Is user allowed to see all room settings (including files and members)
   * @param permissionService
   * @param model
   * @return {boolean}
   */
  viewSettings (permissionService, model) {
    return !permissionService.currentUser ? false : model.owner.id === permissionService.currentUser.id || model.isCoOwner || permissionService.currentUser.permissions.includes('rooms.viewAll');
  },

  /**
   * Is user allowed to change all room settings (including files and members)
   * @param permissionService
   * @param model
   * @return {boolean}
   */
  manageSettings (permissionService, model) {
    return !permissionService.currentUser ? false : model.owner.id === permissionService.currentUser.id || model.isCoOwner || permissionService.currentUser.permissions.includes('rooms.manage');
  },

  /**
   * Is user allowed to become member of this room
   * @param permissionService
   * @param model
   */
  becomeMember (permissionService, model) {
    return !permissionService.currentUser ? false : model.allowMembership && !model.isMember && model.owner.id !== permissionService.currentUser.id;
  }

};
