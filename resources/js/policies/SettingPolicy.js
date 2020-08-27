export default {
  manage (permissionService) {
    return permissionService.currentUser.permissions.includes('settings.manage');
  }
};
