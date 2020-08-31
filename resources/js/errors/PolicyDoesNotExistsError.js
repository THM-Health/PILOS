/**
 * Error that can be thrown if a policy doesn't exists.
 */
export default class PolicyDoesNotExistsError extends Error {
  /**
   * Constructor that initializes the error message.
   *
   * @param policy {String} Policy that wasn't found.
   * @param method {String} Method of the missing policy was tried to call.
   * @return undefined
   */
  constructor (policy, method) {
    super(`The policy method '${policy}.${method}' doesn't exists!`);
  }
}
