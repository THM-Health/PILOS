/**
 * Policy for system actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user can monitor the system or not.
   *
   * @param user
   * @return {boolean}
   */
  monitor (user) {
    return !user ? false : user.permissions.includes('system.monitor');
  }
};
