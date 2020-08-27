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
    return permissionService.currentUser.permissions.includes('settings.manage');
  }
};
