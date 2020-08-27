export default {
  viewAny (permissionService) {
    return permissionService.currentUser.permissions.includes('roles.viewAny');
  }
};
