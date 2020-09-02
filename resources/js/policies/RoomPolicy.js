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

  /**
   * Is user allowed to see any rooms
   * @param permissionService
   * @return {boolean}
   */
  viewAny (permissionService) {
    return permissionService.currentUser && permissionService.currentUser.permissions.includes('rooms.viewAny');
  }

};
