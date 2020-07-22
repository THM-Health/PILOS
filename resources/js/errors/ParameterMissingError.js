/**
 * Error that can be thrown if a necessary parameter of a function is missing.
 */
export default class ParameterMissingError extends Error {
  /**
   * Constructor that initializes the error message.
   *
   * @param parameters {String[]} Array of parameter names that are missing.
   * @param any {boolean} Indicates whether any or all parameters necessary.
   * @return undefined
   */
  constructor (parameters = [], any = false) {
    if (typeof parameters === 'string') {
      super(parameters)
    } else {
      super(`${any ? 'One of the' : 'The'} following parameters should be set: ${parameters.join(', ')}!`)
    }
  }
}
