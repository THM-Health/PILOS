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
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('room_types.viewAny');
  },

  /**
   * Returns a boolean that indicates whether the user can create room types or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  create (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('room_types.create');
  },

  /**
   * Returns a boolean that indicates whether the user can view room types or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  view (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('room_types.view');
  },

  /**
   * Returns a boolean that indicates whether the user can update the passed room type or not.
   *
   * @param permissionService
   * @param roomType
   * @return {boolean}
   */
  update (permissionService, roomType) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('room_types.update');
  },

  /**
   * Returns a boolean that indicates whether the user can delete the passed room type or not.
   *
   * @param permissionService
   * @param roomType
   * @return {boolean}
   */
  delete (permissionService, roomType) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('room_types.delete');
  }
};
