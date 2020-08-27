/**
 * Policy for role actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user can view all roles or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  viewAny (permissionService) {
    return permissionService.currentUser.permissions.includes('roles.viewAny');
  }
};
