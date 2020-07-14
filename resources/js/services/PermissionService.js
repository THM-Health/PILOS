import ParameterMissingError from '../errors/ParameterMissingError'

/**
 *
 */
class PermissionService {
  /**
   *
   */
  constructor () {
    this.permissions = []
  }

  /**
   *
   * @param permissions
   */
  setPermissions (permissions) {
    this.permissions = permissions
  }

  /**
   *
   * @param permission
   * @param policy
   * @param method
   * @param object
   */
  can ({ permission, policy, method, object } = {}) {
    if (process.env.NODE_ENV !== 'production') {
      if (!permission && !policy && !method && !object) {
        throw new ParameterMissingError(['permission', 'policy', 'method', 'object'], true)
      }
    }
  }

  /**
   *
   * @param permission
   * @param policy
   * @param method
   * @param object
   */
  cannot ({ permission, policy, method, object } = {}) {
    return !this.can({ permission, policy, method, object })
  }
}

export default new PermissionService()
