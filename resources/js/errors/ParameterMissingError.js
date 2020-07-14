export default class ParameterMissingError extends Error {
  constructor (parameters = [], any = false) {
    super(`${any ? 'One of the' : 'The'} following parameters should be set: ${parameters.join(', ')}!`)
  }
}
