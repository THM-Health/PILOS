export default class PolicyDoesNotExistsError extends Error {
  constructor (policy, method) {
    super(`The policy method '${policy}.${method}' doesn't exists!`)
  }
}
