/**
 * Policy for administration actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user view the admin panel
   *
   * @param user
   * @return {boolean}
   */
  view (user) {
    return !user ? false : user.permissions.includes('admin.view');
  }
};
