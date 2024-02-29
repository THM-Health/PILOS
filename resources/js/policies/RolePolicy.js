/**
 * Policy for role actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user can view all roles or not.
   *
   * @param user
   * @return {boolean}
   */
  viewAny (user) {
    return !user ? false : user.permissions.includes('roles.viewAny');
  },

  /**
   * Returns a boolean that indicates whether the user can create roles or not.
   *
   * @param user
   * @return {boolean}
   */
  create (user) {
    return !user ? false : user.permissions.includes('roles.create');
  },

  /**
   * Returns a boolean that indicates whether the user can view roles or not.
   *
   * @param user
   * @return {boolean}
   */
  view (user) {
    return !user ? false : user.permissions.includes('roles.view');
  },

  /**
   * Returns a boolean that indicates whether the user can update the passed role or not.
   *
   * @param user
   * @param role
   * @return {boolean}
   */
  update (user) {
    return !user ? false : user.permissions.includes('roles.update');
  },

  /**
   * Returns a boolean that indicates whether the user can delete the passed role or not.
   *
   * @param user
   * @param role
   * @return {boolean}
   */
  delete (user, role) {
    return !user ? false : user.permissions.includes('roles.delete') && !role.superuser;
  }
};
