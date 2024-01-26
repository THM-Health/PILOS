import { useAuthStore } from '../stores/auth.js';
import WrongTypeError from '../errors/WrongTypeError.js';
import ParameterMissingError from '../errors/ParameterMissingError.js';
import Policies from '../policies/index.js';
import PolicyDoesNotExistsError from '../errors/PolicyDoesNotExistsError.js';

export function useUserPermissions () {
  const authStore = useAuthStore();

  const can = (method, policy) => {
    if (import.meta.env.MODE !== 'production') {
      if (typeof policy !== 'string' && typeof policy !== 'object') {
        throw new WrongTypeError('policy', 'string or object');
      }

      if (typeof method !== 'string') {
        throw new WrongTypeError('method', 'string');
      }

      if (typeof policy === 'object' && (!Object.prototype.hasOwnProperty.call(policy, 'model_name') || typeof policy.model_name !== 'string')) {
        throw new ParameterMissingError('The passed object for `policy` has no `model_name` or it is not of type string!');
      }
    }

    if (typeof policy === 'string') {
      if (import.meta.env.MODE !== 'production' && (
        !Object.prototype.hasOwnProperty.call(Policies, policy) ||
          !Object.prototype.hasOwnProperty.call(Policies[policy], method)
      )) {
        throw new PolicyDoesNotExistsError(policy, method);
      }

      return Policies[policy][method](authStore.currentUser);
    }

    const policyName = `${policy.model_name}Policy`;
    if (import.meta.env.MODE !== 'production' && (
      !Object.prototype.hasOwnProperty.call(Policies, policyName) ||
        !Object.prototype.hasOwnProperty.call(Policies[policyName], method)
    )) {
      throw new PolicyDoesNotExistsError(policyName, method);
    }

    return Policies[policyName][method](authStore.currentUser, policy);
  };

  return {
    can
  };
}
