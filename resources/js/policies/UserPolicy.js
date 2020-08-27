/**
 * Policy for user actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user can view all users or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  viewAny (permissionService) {
    return permissionService.currentUser.permissions.includes('users.viewAny');
  }
};
