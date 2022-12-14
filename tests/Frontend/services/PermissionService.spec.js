import PermissionService from '../../../resources/js/services/PermissionService';
import ParameterMissingError from '../../../resources/js/errors/ParameterMissingError';
import WrongTypeError from '../../../resources/js/errors/WrongTypeError';
import PolicyDoesNotExistsError from '../../../resources/js/errors/PolicyDoesNotExistsError';
import EventBus from '../../../resources/js/services/EventBus';
import { nextTick } from 'vue';

describe('PermissionService', () => {
  describe('setCurrentUser', () => {
    it('fires an event if the current user gets set and passes the newly set user as parameter', async () => {
      const oldUser = PermissionService.currentUser;
      const newUser = { permissions: ['foo', 'bar'] };
      const handleUserChanged = vi.fn();

      EventBus.$on('currentUserChangedEvent', handleUserChanged);
      PermissionService.setCurrentUser(newUser);
      await nextTick();

      expect(handleUserChanged).toBeCalledTimes(1);
      expect(handleUserChanged).toBeCalledWith(newUser);

      EventBus.$off('currentUserChangedEvent', handleUserChanged);

      const spy = vi.fn();
      EventBus.$on('currentUserChangedEvent', spy);
      PermissionService.setCurrentUser(newUser, false);
      await nextTick();

      expect(spy).toBeCalledTimes(0);

      EventBus.$off('currentUserChangedEvent', spy);
      PermissionService.setCurrentUser(oldUser);
    });
  });

  describe('can', () => {
    describe('policy and method parameter', () => {
      it('throws an error if the passed parameters hasn\'t the correct type', () => {
        expect(() => PermissionService.can({}, 'test')).toThrow(WrongTypeError);
      });

      it('throws an error if the policy or its method doesn\'t exists', () => {
        vi.mock('@/policies/index.js', () => {
          return {
            default: {
              TestPolicy: { test: () => true }
            }
          };
        });
        expect(() => PermissionService.can('test', 'test')).toThrow(new PolicyDoesNotExistsError('test', 'test'));
        expect(() => PermissionService.can('testA', 'TestPolicy')).toThrow(new PolicyDoesNotExistsError('TestPolicy', 'testA'));
      });

      it('returns the boolean value returned by the policy method', () => {
        vi.mock('@/policies/index.js', () => {
          return {
            default: {
              TestPolicy: { test: () => true }
            }
          };
        });
        expect(PermissionService.can('test', 'TestPolicy')).toEqual(true);
      });
    });

    describe('object and method parameter', () => {
      it('throws an error if the passed parameters hasn\'t the correct type', () => {
        expect(() => PermissionService.can({}, {})).toThrow(WrongTypeError);
      });

      it('throws an error if the passed object hasn\'t set the `model_name` property', () => {
        expect(() => PermissionService.can('test', {})).toThrow(ParameterMissingError);
        expect(() => PermissionService.can('test', { model_name: {} })).toThrow(ParameterMissingError);
      });

      it('throws an error if the policy for the object or its method doesn\'t exists', () => {
        vi.mock('@/policies/index.js', () => {
          return {
            default: {
              TestPolicy: { test: () => true }
            }
          };
        });
        expect(() => PermissionService.can('test', { model_name: 'test' })).toThrow(new PolicyDoesNotExistsError('testPolicy', 'test'));
        expect(() => PermissionService.can('testA', { model_name: 'Test' })).toThrow(new PolicyDoesNotExistsError('TestPolicy', 'testA'));
      });

      it('returns the boolean value returned by the policy method', () => {
        vi.mock('@/policies/index.js', () => {
          return {
            default: {
              TestPolicy: { test: () => true }
            }
          };
        });
        expect(PermissionService.can('test', { model_name: 'Test' })).toEqual(true);
      });
    });
  });

  describe('cannot', () => {
    it('returns the inverted boolean value of the can method and passes all arguments to it', () => {
      vi.mock('@/policies/index.js', () => {
        return {
          default: {
            TestPolicy: { test: () => true }
          }
        };
      });
      expect(PermissionService.cannot('test', 'TestPolicy')).toEqual(false);
    });
  });
});
