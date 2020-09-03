import ParameterMissingError from '../errors/ParameterMissingError';
import WrongTypeError from '../errors/WrongTypeError';
import Policies from '../policies';
import PolicyDoesNotExistsError from '../errors/PolicyDoesNotExistsError';
import EventBus from './EventBus';

/**
 * Service that holds the current user and provides methods that allows to check the permissions of the current user.
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
     * The current user object.
     *
     * Don't set the current user directly but always use the `PermissionService.setCurrentUser` function.
     *
     * @property currentUser
     * @type {Object}
     * @private
     */
    this.currentUser = undefined;
  }

  /**
   * Sets the current user of the application against which the checks will be executed to permit or deny actions.
   *
   * @method setCurrentUser
   * @param currentUser {Object} The current user that should be set
   * @event currentUserChangedEvent Gets triggered after setting the new current user, which gets passed as the parameter.
   * @return undefined
   */
  setCurrentUser (currentUser) {
    this.currentUser = $.isEmptyObject(currentUser) ? undefined : currentUser;

    /**
     * Triggers when new current user set on this service.
     *
     * @property {Object} currentUser The newly set current user
     */
    EventBus.$emit('currentUserChangedEvent', currentUser);
  }

  /**
   * Checks whether the current user of the application has the passed rights.
   *
   * A method and the name of the policy that contains the method should be passed. Instead of the policy name
   * a object can also be passed that must contain a `modelName` from which the policy gets derived.
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
   *   // policies/index.js
   *   import TestPolicy from './TestPolicy'
   *
   *   // policies/TestPolicy.js
   *   export default {
   *     viewAll (permissionService) {
   *       return permissionService.currentUser.permissions.includes('index_test')
   *     },
   *
   *     view (permissionService, model) {
   *       return permissionService.currentUser.permissions.includes('index_test') && currentUser.id === model.id
   *     }
   *   }
   *
   * @example
   *   // Call a policy method to check the permissions
   *   // (in the policies folder must be defined a TestPolicy and have a method viewAll!)
   *   PermissionService.can('viewAll', 'TestPolicy')
   *
   *   // Call a policy method by passing a model object and a method
   *   PermissionService.can('view', { modelName: 'Test', id: 1 })
   *
   * @method can
   * @param method {String} Name of the method in the policy that should be called to check the permissions.
   * @param policy {String|Object} Name of the policy where the `method` should be called (e.g. test for TestPolicy) or
   *    model object containing a `modelName` from which the policy name get derived.
   * @throws WrongTypeError If the passed parameter has a wrong type.
   * @throws ParameterMissingError If the model object has no modelName.
   * @throws PolicyDoesNotExistsError If the policy doesn't exists.
   * @return boolean Indicating whether the action is permitted or not.
   */
  can (method, policy) {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof policy !== 'string' && typeof policy !== 'object') {
        throw new WrongTypeError('policy', 'string or object');
      }

      if (typeof method !== 'string') {
        throw new WrongTypeError('method', 'string');
      }

      if (typeof policy === 'object' && (!Object.prototype.hasOwnProperty.call(policy, 'modelName') || typeof policy.modelName !== 'string')) {
        throw new ParameterMissingError('The passed object for `policy` has no `modelName` or it is not of type string!');
      }
    }

    if (typeof policy === 'string') {
      if (process.env.NODE_ENV !== 'production' && (
        !Object.prototype.hasOwnProperty.call(Policies, policy) ||
        !Object.prototype.hasOwnProperty.call(Policies[policy], method)
      )) {
        throw new PolicyDoesNotExistsError(policy, method);
      }

      return Policies[policy][method](this);
    }

    const policyName = `${policy.modelName}Policy`;
    if (process.env.NODE_ENV !== 'production' && (
      !Object.prototype.hasOwnProperty.call(Policies, policyName) ||
      !Object.prototype.hasOwnProperty.call(Policies[policyName], method)
    )) {
      throw new PolicyDoesNotExistsError(policyName, method);
    }

    return Policies[policyName][method](this, policy);
  }

  /**
   * Checks whether the current user of the application hasn't the passed rights.
   *
   * @method cannot
   * @param method {String} Name of the method in the policy that should be called to check the permissions.
   * @param policy {String|Object} Name of the policy where the `method` should be called (e.g. test for TestPolicy) or
   *    model object containing a `modelName` from which the policy name get derived.
   * @throws WrongTypeError If the passed parameter has a wrong type.
   * @throws ParameterMissingError If the model object has no modelName.
   * @throws PolicyDoesNotExistsError If the policy doesn't exists.
   * @return boolean Indicating whether the action isn't permitted.
   */
  cannot (method, policy) {
    return !this.can(method, policy);
  }
}

export default new PermissionService();
