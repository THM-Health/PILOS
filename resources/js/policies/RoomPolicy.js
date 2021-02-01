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

  delete (permissionService, model) {
    return !permissionService.currentUser ? false : model.isOwner || permissionService.currentUser.permissions.includes('rooms.delete');
  },

  manageFiles (permissionService, model) {
    return model.isOwner;
  }

};
