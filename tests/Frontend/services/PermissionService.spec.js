import PermissionService from '../../../resources/js/services/PermissionService'
import LocaleSelector from '../../../resources/js/components/LocaleSelector'
import ParameterMissingError from '../../../resources/js/errors/ParameterMissingError'

describe('PermissionService', function () {
  describe('can', function () {
    it('throws an error if nothing was passed', function () {
      expect(PermissionService.can).toThrow(ParameterMissingError)
    })

    it('throws an error if a combination of permission, policy and object gets passed', function () {

    })

    describe('permission parameter', function () {
      it('returns `false` if the instance hasn\'t the passed permission', function () {

      })

      it('returns `true` if the instance hasn\'t the passed permission', function () {

      })

      it('throws an error if the passed permission hasn\'t the correct type', function () {

      })
    })

    describe('policy and method parameter', function () {
      it('throws an error if only one of the parameter was passed', function () {

      })

      it('throws an error if the passed parameters hasn\'t the correct type', function () {

      })

      it('throws an error if the policy or its method doesn\'t exists', function () {

      })

      it('returns the boolean value returned by the policy method', function () {

      })
    })

    describe('object and method parameter', function () {

    })
  })

  describe('cannot', function () {
    it('returns the inverted boolean value of the can method and passes all arguments to it', function () {
      const permission = 'a'
      const policy = 'b'
      const method = 'c'
      const object = 'd'
      const canReturnVal = false

      PermissionService.__Rewire__('can', (params) => {
        expect(params.permission).toEqual(permission)
        expect(params.policy).toEqual(policy)
        expect(params.method).toEqual(method)
        expect(params.object).toEqual(object)

        return canReturnVal
      })

      expect(PermissionService.cannot({
        permission, policy, method, object
      })).toBeTruthy()

      LocaleSelector.__ResetDependency__('can')
    })
  })
})
