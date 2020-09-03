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
    return permissionService.currentUser && permissionService.currentUser.permissions.includes('roles.viewAny');
  },

  create (permissionService) {
    return permissionService.currentUser && permissionService.currentUser.permissions.includes('roles.create');
  },

  view (permissionService, role) {
    return permissionService.currentUser && permissionService.currentUser.permissions.includes('roles.view');
  },

  update (permissionService, role) {
    return permissionService.currentUser && permissionService.currentUser.permissions.includes('roles.update') && !role.default;
  },

  delete (permissionService, role) {
    return permissionService.currentUser && permissionService.currentUser.permissions.includes('roles.delete') && !role.default;
  }
};
