/**
 * Policy for room type actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user can view all room types or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  viewAny (permissionService) {
    return permissionService.currentUser;
  },

  /**
   * Returns a boolean that indicates whether the user can create room types or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  create (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('roomTypes.create');
  },

  /**
   * Returns a boolean that indicates whether the user can view room types or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  view (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('roomTypes.view');
  },

  /**
   * Returns a boolean that indicates whether the user can update the passed room type or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  update (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('roomTypes.update');
  },

  /**
   * Returns a boolean that indicates whether the user can delete the passed room type or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  delete (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('roomTypes.delete');
  }
};
