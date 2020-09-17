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
    return permissionService.currentUser && permissionService.currentUser.permissions.includes('rooms.create');
  },

  delete (permissionService, model) {
    return model.isOwner || (permissionService.currentUser && permissionService.currentUser.permissions.includes('rooms.delete'));
  },

  manageFiles (permissionService, model) {
    return model.isOwner;
  }

};
