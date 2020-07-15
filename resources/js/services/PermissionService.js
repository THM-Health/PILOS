import ParameterMissingError from '../errors/ParameterMissingError'
import WrongParameterCombinationError from '../errors/WrongParameterCombinationError'
import WrongTypeError from '../errors/WrongTypeError'
import Policies from '../policies'
import PolicyDoesNotExistsError from '../errors/PolicyDoesNotExistsError'

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
      // Parameter checks
      if (!permission && !policy && !method && !object) {
        throw new ParameterMissingError(['permission', 'policy', 'method', 'object'], true)
      } else if ((permission && policy) || (permission && method) || (permission && object) || (policy && object)) {
        throw new WrongParameterCombinationError()
      } else if ((policy && !method) || (object && !method)) {
        throw new ParameterMissingError(['method'])
      } else if ((method && !policy && !object)) {
        throw new ParameterMissingError(['object', 'policy'], true)
      }

      if (permission && typeof permission !== 'string') {
        throw new WrongTypeError('permission', 'string')
      }

      if (policy && typeof policy !== 'string') {
        throw new WrongTypeError('policy', 'string')
      }

      if (method && typeof method !== 'string') {
        throw new WrongTypeError('method', 'string')
      }

      if (object && typeof object !== 'object') {
        throw new WrongTypeError('object', 'object')
      } else if (object && (!Object.prototype.hasOwnProperty.call(object, 'modelName') || typeof object.modelName !== 'string')) {
        throw new ParameterMissingError('The passed `object` has no `modelName` or it is not of type string!')
      }
    }

    if (permission) {
      return this.permissions.includes(permission)
    } else if (policy) {
      if (process.env.NODE_ENV !== 'production' && (
        !Object.prototype.hasOwnProperty.call(Policies, policy) ||
        !Object.prototype.hasOwnProperty.call(Policies[policy], method)
      )) {
        throw new PolicyDoesNotExistsError(policy, method)
      }

      return Policies[policy][method](this)
    }

    policy = `${object.modelName}Policy`
    if (process.env.NODE_ENV !== 'production' && (
      !Object.prototype.hasOwnProperty.call(Policies, policy) ||
      !Object.prototype.hasOwnProperty.call(Policies[policy], method)
    )) {
      throw new PolicyDoesNotExistsError(policy, method)
    }

    return Policies[policy][method](this, object)
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
