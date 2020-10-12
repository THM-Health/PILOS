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
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('users.viewAny');
  },

  /**
   * Returns a boolean that indicates whether the user can view the passed user or not.
   *
   * @param permissionService
   * @param user
   * @return {boolean}
   */
  view (permissionService, user) {
    if (!permissionService.currentUser) {
      return false;
    } else if (user.id === permissionService.currentUser.id) {
      return true;
    }

    return permissionService.currentUser.permissions.includes('users.view');
  },

  /**
   * Returns a boolean that indicates whether the user can create users or not.
   *
   * @param permissionService
   * @return {boolean}
   */
  create (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('users.create');
  },

  /**
   * Returns a boolean that indicates whether the user can update the passed user or not.
   *
   * @param permissionService
   * @param user
   * @return {boolean}
   */
  update (permissionService, user) {
    if (!permissionService.currentUser) {
      return false;
    } else if (user.id === permissionService.currentUser.id) {
      return true;
    }

    return permissionService.currentUser.permissions.includes('users.update');
  },

  /**
   * Returns a boolean that indicates whether the user can delete the passed user or not.
   *
   * @param permissionService
   * @param user
   * @return {boolean}
   */
  delete (permissionService, user) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('users.delete') && user.id !== permissionService.currentUser.id;
  },

  /**
   * Returns true if the user has permission to update users and the user model is not the
   * current users model.
   *
   * @param permissionService
   * @param user
   * @return {boolean}
   */
  editUserRole (permissionService, user) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('users.update') && user.id !== permissionService.currentUser.id;
  }
};
