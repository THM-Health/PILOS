/**
 * Policy for meeting actions
 */
export default {

  viewAny (user) {
    return !user ? false : user.permissions.includes('meetings.viewAny');
  }

};
