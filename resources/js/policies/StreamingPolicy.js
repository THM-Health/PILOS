/**
 * Policy for streaming config actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user can view all streaming settings or not.
   *
   * @param user
   * @return {boolean}
   */
  viewAny(user) {
    return !user ? false : user.permissions.includes("streaming.viewAny");
  },

  /**
   * Returns a boolean that indicates whether the user can update the streaming settings or not.
   *
   * @param user
   * @return {boolean}
   */
  update(user) {
    return !user ? false : user.permissions.includes("streaming.update");
  },
};
