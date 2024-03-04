/**
 * Policy for server actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user can view all servers or not.
   *
   * @param user
   * @return {boolean}
   */
  viewAny (user) {
    return !user ? false : user.permissions.includes('servers.viewAny');
  },

  /**
   * Returns a boolean that indicates whether the user can create servers or not.
   *
   * @param user
   * @return {boolean}
   */
  create (user) {
    return !user ? false : user.permissions.includes('servers.create');
  },

  /**
   * Returns a boolean that indicates whether the user can view server or not.
   *
   * @param user
   * @return {boolean}
   */
  view (user) {
    return !user ? false : user.permissions.includes('servers.view');
  },

  /**
   * Returns a boolean that indicates whether the user can update the passed server or not.
   *
   * @param user
   * @return {boolean}
   */
  update (user) {
    return !user ? false : user.permissions.includes('servers.update');
  },

  /**
   * Returns a boolean that indicates whether the user can delete the passed server or not.
   *
   * @param user
   * @return {boolean}
   */
  delete (user) {
    return !user ? false : user.permissions.includes('servers.delete');
  }
};
