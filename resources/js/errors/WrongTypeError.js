export default class WrongTypeError extends Error {
  constructor (parameter, type) {
    super(`Expected '${parameter}' to be of type '${type}'!`)
  }
}
