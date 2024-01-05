/**
 * Policy for system actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user can monitor the system or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  monitor (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('system.monitor');
  }
};
