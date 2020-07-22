import PermissionService from '../../../resources/js/services/PermissionService'
import ParameterMissingError from '../../../resources/js/errors/ParameterMissingError'
import WrongParameterCombinationError from '../../../resources/js/errors/WrongParameterCombinationError'
import WrongTypeError from '../../../resources/js/errors/WrongTypeError'
import PolicyDoesNotExistsError from '../../../resources/js/errors/PolicyDoesNotExistsError'
import EventBus from '../../../resources/js/services/EventBus'

describe('PermissionService', function () {
  describe('setPermissions', function () {
    it('fires an event if the permissions gets set and passes the newly set permissions as parameter', function (done) {
      const oldPermissions = PermissionService.permissions
      const newPermissions = ['foo', 'bar']
      const handlePermissionsChanged = function () {
        expect(arguments.length).toEqual(1)
        expect(arguments[0]).toEqual(newPermissions)
        PermissionService.setPermissions(oldPermissions)
        done()
      }

      EventBus.$once('permissionsChangedEvent', handlePermissionsChanged)
      PermissionService.setPermissions(newPermissions)
    })
  })

  describe('can', function () {
    it('throws an error if nothing was passed', function () {
      expect(PermissionService.can).toThrow(ParameterMissingError)
    })

    it('throws an error if a wrong combination of permission, policy and object gets passed', function () {
      expect(() => PermissionService.can({ permission: 'test', method: 'test' })).toThrow(WrongParameterCombinationError)
      expect(() => PermissionService.can({ permission: 'test', policy: 'test' })).toThrow(WrongParameterCombinationError)
      expect(() => PermissionService.can({ permission: 'test', object: {} })).toThrow(WrongParameterCombinationError)
      expect(() => PermissionService.can({ policy: 'test', object: {} })).toThrow(WrongParameterCombinationError)

      expect(() => PermissionService.can({ policy: 'test' })).toThrow(ParameterMissingError)
      expect(() => PermissionService.can({ object: {} })).toThrow(ParameterMissingError)
      expect(() => PermissionService.can({ method: 'test' })).toThrow(ParameterMissingError)
    })

    describe('permission parameter', function () {
      it('returns `false` if the instance hasn\'t the passed permission', function () {
        expect(PermissionService.can({ permission: 'test' })).toBeFalsy()
      })

      it('returns `true` if the instance has the passed permission', function () {
        PermissionService.setPermissions(['test'])
        expect(PermissionService.can({ permission: 'test' })).toBeTruthy()
      })

      it('throws an error if the passed permission hasn\'t the correct type', function () {
        expect(() => PermissionService.can({ permission: {} })).toThrow(WrongTypeError)
      })
    })

    describe('policy and method parameter', function () {
      it('throws an error if the passed parameters hasn\'t the correct type', function () {
        expect(() => PermissionService.can({ policy: 'test', method: {} })).toThrow(WrongTypeError)
        expect(() => PermissionService.can({ policy: {}, method: 'test' })).toThrow(WrongTypeError)
      })

      it('throws an error if the policy or its method doesn\'t exists', function () {
        PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } })
        expect(() => PermissionService.can({ policy: 'test', method: 'test' })).toThrow(new PolicyDoesNotExistsError('test', 'test'))
        expect(() => PermissionService.can({ policy: 'TestPolicy', method: 'testA' })).toThrow(new PolicyDoesNotExistsError('TestPolicy', 'testA'))
        PermissionService.__ResetDependency__('Policies')
      })

      it('returns the boolean value returned by the policy method', function () {
        PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } })
        expect(PermissionService.can({ policy: 'TestPolicy', method: 'test' })).toEqual(true)
        PermissionService.__ResetDependency__('Policies')
      })
    })

    describe('object and method parameter', function () {
      it('throws an error if the passed parameters hasn\'t the correct type', function () {
        expect(() => PermissionService.can({ object: {}, method: {} })).toThrow(WrongTypeError)
        expect(() => PermissionService.can({ object: 'test', method: 'test' })).toThrow(WrongTypeError)
      })

      it('throws an error if the passed object hasn\'t set the `modelName` property', function () {
        expect(() => PermissionService.can({ object: {}, method: 'test' })).toThrow(ParameterMissingError)
        expect(() => PermissionService.can({ object: { modelName: {} }, method: 'test' })).toThrow(ParameterMissingError)
      })

      it('throws an error if the policy for the object or its method doesn\'t exists', function () {
        PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } })
        expect(() => PermissionService.can({ object: { modelName: 'test' }, method: 'test' })).toThrow(new PolicyDoesNotExistsError('testPolicy', 'test'))
        expect(() => PermissionService.can({ object: { modelName: 'Test' }, method: 'testA' })).toThrow(new PolicyDoesNotExistsError('TestPolicy', 'testA'))
        PermissionService.__ResetDependency__('Policies')
      })

      it('returns the boolean value returned by the policy method', function () {
        PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } })
        expect(PermissionService.can({ object: { modelName: 'Test' }, method: 'test' })).toEqual(true)
        PermissionService.__ResetDependency__('Policies')
      })
    })
  })

  describe('cannot', function () {
    it('returns the inverted boolean value of the can method and passes all arguments to it', function () {
      PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } })
      expect(PermissionService.cannot({ policy: 'TestPolicy', method: 'test' })).toEqual(false)
      PermissionService.__ResetDependency__('Policies')
    })
  })
})
