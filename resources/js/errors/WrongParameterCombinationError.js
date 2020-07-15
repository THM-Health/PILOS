export default class WrongParameterCombinationError extends Error {
  constructor () {
    super('A wrong combination of parameters was passed!')
  }
}
