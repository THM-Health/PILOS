/**
 * Policy for setting actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user can manage settings or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  manage (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('settings.manage');
  },

  /**
   * Returns a boolean that indicates whether the user can view all application settings or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  viewAny (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('settings.viewAny');
  },

  /**
   * Returns a boolean that indicates whether the user can update the application settings or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  update (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('settings.update');
  }
};
