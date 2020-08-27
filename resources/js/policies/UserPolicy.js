export default {
  viewAny (permissionService) {
    return permissionService.currentUser.permissions.includes('users.viewAny');
  }
};
