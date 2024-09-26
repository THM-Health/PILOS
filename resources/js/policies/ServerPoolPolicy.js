/**
 * Policy for server pool actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user can view all server pools or not.
   *
   * @param user
   * @return {boolean}
   */
  viewAny (user) {
    return !user ? false : user.permissions.includes('serverPools.viewAny');
  },

  /**
   * Returns a boolean that indicates whether the user can create server pools or not.
   *
   * @param user
   * @return {boolean}
   */
  create (user) {
    return !user ? false : user.permissions.includes('serverPools.create');
  },

  /**
   * Returns a boolean that indicates whether the user can view server pool or not.
   *
   * @param user
   * @return {boolean}
   */
  view (user) {
    return !user ? false : user.permissions.includes('serverPools.view');
  },

  /**
   * Returns a boolean that indicates whether the user can update the passed server pool or not.
   *
   * @param user
   * @return {boolean}
   */
  update (user) {
    return !user ? false : user.permissions.includes('serverPools.update');
  },

  /**
   * Returns a boolean that indicates whether the user can delete the passed server pool or not.
   *
   * @param user
   * @return {boolean}
   */
  delete (user) {
    return !user ? false : user.permissions.includes('serverPools.delete');
  }
};
