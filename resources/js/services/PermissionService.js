import ParameterMissingError from '../errors/ParameterMissingError'
import WrongParameterCombinationError from '../errors/WrongParameterCombinationError'
import WrongTypeError from '../errors/WrongTypeError'
import Policies from '../policies'
import PolicyDoesNotExistsError from '../errors/PolicyDoesNotExistsError'
import EventBus from './EventBus'

/**
 * Service that holds the permissions of the current user and provides methods that
 * allows to check the permissions of the current user.
 *
 * @class PermissionService
 */
class PermissionService {
  /**
   * Constructor of the permission service.
   *
   * Initializes the properties of the permission service.
   *
   * @method constructor
   * @return undefined
   */
  constructor () {
    /**
     * Array containing the permissions that has the current user of the application.
     *
     * Don't set the permissions directly but always use the `PermissionService.setPermissions` function.
     *
     * @property permissions
     * @type {String[]}
     * @private
     */
    this.permissions = []
  }

  /**
   * Sets the permissions that are available for the current user of the application and
   * against which the checks will be executed to permit or deny actions.
   *
   * @method setPermissions
   * @param permissions {String[]} The permissions that should be set
   * @event permissionsChangedEvent Gets triggered after setting the new permissions, which gets passed as the parameter.
   * @return undefined
   */
  setPermissions (permissions) {
    this.permissions = permissions

    /**
     * Triggers when new permissions set on this service.
     *
     * @property {String[]} permissions The newly set permissions
     */
    EventBus.$emit('permissionsChangedEvent', permissions)
  }

  /**
   * Checks whether the current user of the application has the passed rights.
   *
   * Either a permission can be passed or a policy name and the method that should be called on the policy
   * or a method and a model object containing a `modelName` from which the corresponding policy derived.
   * Don't mix the parameters in the call together!
   *
   * If a model object was passed it also gets passed as a parameter to the policy method along to the
   * instance of the PermissionService that gets also passed as the first parameter when a policy is
   * directly specified.
   *
   * Make sure if passing a policy or a model object that the policy and its method is specified in the
   * policies folder. The method can't be async and must always return a boolean value e.g. true if
   * the action is permitted and false otherwise.
   *
   * @example
   *   // params are { policy: 'test' method: 'viewAll' } or { object: { modelName: 'Test', id: 1 }, method: 'view' }
   *   // policies/index.js
   *   import TestPolicy from './TestPolicy'
   *
   *   // policies/TestPolicy.js
   *   export default {
   *     viewAll (permissionService) {
   *       return permissionService.can({ permission: 'index_test' })
   *     },
   *
   *     view (permissionService, model) {
   *       return permissionService.can({ permission: 'view_test' }) && model.id == 1
   *     }
   *   }
   *
   * @example
   *   // Check directly a permission
   *   PermissionService.can({ permission: 'edit_something' })
   *
   *   // Call a policy method to check the permissions
   *   // (in the policies folder must be defined a TestPolicy and have a method viewAll!)
   *   PermissionService.can({ policy: 'test', method: 'viewAll' })
   *
   *   // Call a policy method by passing a model object and a method
   *   PermissionService.can({ object: { modelName: 'Test', id: 1 }, method: 'view' })
   *
   * @method can
   * @param [params={}] {Object}
   * @param params.permission {String} The permission to check for.
   * @param params.policy {String} Name of the policy where the `method` should be called (e.g. test for TestPolicy).
   * @param params.method {String} Name of the method in the policy that should be called to check the permissions.
   * @param params.object {Object} Model object containing a `modelName` from which the policy name get derived.
   * @throws ParameterMissingError If no parameter was passed or only policy or method or object without the second part.
   * @throws WrongParameterCombinationError If not allowed combination of parameters gets passed.
   * @throws WrongTypeError If the passed parameter has a wrong type.
   * @throws PolicyDoesNotExistsError If the policy doesn't exists.
   * @return boolean Indicating whether the action is permitted or not.
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
   * Checks whether the current user of the application hasn't the passed rights.
   *
   * @method cannot
   * @param [params={}] {Object}
   * @param params.permission {String} The permission to check for.
   * @param params.policy {String} Name of the policy where the `method` should be called (e.g. test for TestPolicy).
   * @param params.method {String} Name of the method in the policy that should be called to check the permissions.
   * @param params.object {Object} Model object containing a `modelName` from which the policy name get derived.
   * @throws ParameterMissingError If no parameter was passed or only policy or method or object without the second part.
   * @throws WrongParameterCombinationError If not allowed combination of parameters gets passed.
   * @throws WrongTypeError If the passed parameter has a wrong type.
   * @throws PolicyDoesNotExistsError If the policy doesn't exists.
   * @return boolean Indicating whether the action isn't permitted.
   */
  cannot ({ permission, policy, method, object } = {}) {
    return !this.can({ permission, policy, method, object })
  }
}

export default new PermissionService()
