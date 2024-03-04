/**
 * Policy for application config actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user can view all application settings or not.
   *
   * @param user
   * @return {boolean}
   */
  viewAny (user) {
    return !user ? false : user.permissions.includes('applicationSettings.viewAny');
  },

  /**
   * Returns a boolean that indicates whether the user can update the application settings or not.
   *
   * @param user
   * @return {boolean}
   */
  update (user) {
    return !user ? false : user.permissions.includes('applicationSettings.update');
  }
};
