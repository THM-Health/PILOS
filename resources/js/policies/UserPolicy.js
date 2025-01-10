/**
 * Policy for user actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user can view all users or not.
   *
   * @param user
   * @return {boolean}
   */
  viewAny(user) {
    return !user ? false : user.permissions.includes("users.viewAny");
  },

  /**
   * Returns a boolean that indicates whether the user can view the passed user or not.
   *
   * @param user
   * @param model
   * @return {boolean}
   */
  view(user, model) {
    if (!user) {
      return false;
    } else if (parseInt(model.id) === user.id) {
      return true;
    }

    return user.permissions.includes("users.view");
  },

  /**
   * Returns a boolean that indicates whether the user can create users or not.
   *
   * @param user
   * @return {boolean}
   */
  create(user) {
    return !user ? false : user.permissions.includes("users.create");
  },

  /**
   * Returns a boolean that indicates whether the user can update the passed user or not.
   *
   * @param user
   * @param model
   * @return {boolean}
   */
  update(user, model) {
    if (!user) {
      return false;
    } else if (parseInt(model.id) === user.id) {
      return true;
    }

    if (model.superuser && !user.superuser) return false;

    return user.permissions.includes("users.update");
  },

  /**
   * Returns a boolean that indicates whether the user can delete the passed user or not.
   *
   * @param user
   * @param model
   * @return {boolean}
   */
  delete(user, model) {
    if (!user || model.id === user.id) return false;

    if (model.superuser && !user.superuser) return false;

    return user.permissions.includes("users.delete");
  },

  /**
   * Returns true if the user has permission to update users and the user model is not the
   * current users model.
   *
   * @param user
   * @param model
   * @return {boolean}
   */
  editUserRole(user, model) {
    return !user
      ? false
      : user.permissions.includes("users.update") && model.id !== user.id;
  },

  /**
   * Returns true if the user has permissions to update users specific attributes (firstname, lastname, username and
   * email). Either the user to update is not the current user or the user has the permission to change his own
   * attributes.
   *
   * @param user
   * @param model
   * @return {boolean|boolean|*}
   */
  updateAttributes(user, model) {
    if (!user || model.authenticator !== "local") {
      return false;
    }

    return (
      this.update(user, model) &&
      (user.permissions.includes("users.updateOwnAttributes") ||
        model.id !== user.id)
    );
  },

  /**
   * Returns true if the user has the permission to reset password for registered users. Only the passwords
   * of not newly created users with generated passwords can be reset. Also the user can not reset his own
   * password.
   *
   * @param user
   * @param model
   * @return {boolean}
   */
  resetPassword(user, model) {
    if (!user || model.authenticator !== "local") {
      return false;
    }

    return (
      this.update(user, model) &&
      user.id !== model.id &&
      !model.initial_password_set
    );
  },
};
