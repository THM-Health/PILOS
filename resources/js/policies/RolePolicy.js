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
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('roles.viewAny');
  },

  /**
   * Returns a boolean that indicates whether the user can create roles or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  create (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('roles.create');
  },

  /**
   * Returns a boolean that indicates whether the user can view roles or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  view (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('roles.view');
  },

  /**
   * Returns a boolean that indicates whether the user can update the passed role or not.
   *
   * @param permissionService
   * @param role
   * @return {boolean}
   */
  update (permissionService, role) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('roles.update') && !role.default;
  },

  /**
   * Returns a boolean that indicates whether the user can delete the passed role or not.
   *
   * @param permissionService
   * @param role
   * @return {boolean}
   */
  delete (permissionService, role) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('roles.delete') && !role.default;
  }
};
