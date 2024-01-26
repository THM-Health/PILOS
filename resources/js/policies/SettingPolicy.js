/**
 * Policy for setting actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user can manage settings or not.
   *
   * @param user
   * @return {boolean}
   */
  manage (user) {
    return !user ? false : user.permissions.includes('settings.manage');
  }
};
