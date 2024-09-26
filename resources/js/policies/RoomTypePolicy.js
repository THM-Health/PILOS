/**
 * Policy for room type actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user can view all room types or not.
   *
   * @param user
   * @return {boolean}
   */
  viewAny (user) {
    return !!user;
  },

  /**
   * Returns a boolean that indicates whether the user can create room types or not.
   *
   * @param user
   * @return {boolean}
   */
  create (user) {
    return !user ? false : user.permissions.includes('roomTypes.create');
  },

  /**
   * Returns a boolean that indicates whether the user can view room types or not.
   *
   * @param user
   * @return {boolean}
   */
  view (user) {
    return !user ? false : user.permissions.includes('roomTypes.view');
  },

  /**
   * Returns a boolean that indicates whether the user can update the passed room type or not.
   *
   * @param user
   * @return {boolean}
   */
  update (user) {
    return !user ? false : user.permissions.includes('roomTypes.update');
  },

  /**
   * Returns a boolean that indicates whether the user can delete the passed room type or not.
   *
   * @param user
   * @return {boolean}
   */
  delete (user) {
    return !user ? false : user.permissions.includes('roomTypes.delete');
  }
};
