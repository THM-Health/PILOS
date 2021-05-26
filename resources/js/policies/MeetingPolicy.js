/**
 * Policy for meeting actions
 */
export default {

  viewAny (permissionService) {
    return !permissionService.currentUser ? false : permissionService.currentUser.permissions.includes('meetings.viewAny');
  }

};
