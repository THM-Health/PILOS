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

  viewAll (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('rooms.viewAll');
  },

  viewInvitation (permissionService, model) {
    return !permissionService.currentUser ? false : model.owner.id === permissionService.currentUser.id || model.isModerator || model.isCoOwner || permissionService.currentUser.permissions.includes('rooms.viewAll');
  },

  delete (permissionService, model) {
    return !permissionService.currentUser ? false : model.owner.id === permissionService.currentUser.id || permissionService.currentUser.permissions.includes('rooms.manage');
  },

  manageFiles (permissionService, model) {
    return !permissionService.currentUser ? false : model.owner.id === permissionService.currentUser.id || model.isCoOwner || permissionService.currentUser.permissions.includes('rooms.manage');
  },

  viewSettings (permissionService, model) {
    return !permissionService.currentUser ? false : model.owner.id === permissionService.currentUser.id || model.isCoOwner || permissionService.currentUser.permissions.includes('rooms.viewAll');
  },

  manageSettings (permissionService, model) {
    return !permissionService.currentUser ? false : model.owner.id === permissionService.currentUser.id || model.isCoOwner || permissionService.currentUser.permissions.includes('rooms.manage');
  }

};
