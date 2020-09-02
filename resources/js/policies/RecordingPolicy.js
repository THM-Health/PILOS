/**
 * Policy for recording actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user can view any recordings or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  viewAny (permissionService) {
    return permissionService.currentUser && permissionService.currentUser.permissions.includes('recordings.viewAny');
  }
};
