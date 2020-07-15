export default class ParameterMissingError extends Error {
  constructor (parameters = [], any = false) {
    if (typeof parameters === 'string') {
      super(parameters)
    } else {
      super(`${any ? 'One of the' : 'The'} following parameters should be set: ${parameters.join(', ')}!`)
    }
  }
}
