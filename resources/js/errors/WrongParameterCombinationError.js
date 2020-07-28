/**
 * Error that can be thrown if a wrong combination of parameters was passed to a function.
 */
export default class WrongParameterCombinationError extends Error {
  /**
   * Constructor that initializes the error message.
   *
   * @return undefined
   */
  constructor () {
    super('A wrong combination of parameters was passed!');
  }
}
