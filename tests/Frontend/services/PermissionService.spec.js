import PermissionService from '../../../resources/js/services/PermissionService';
import ParameterMissingError from '../../../resources/js/errors/ParameterMissingError';
import WrongTypeError from '../../../resources/js/errors/WrongTypeError';
import PolicyDoesNotExistsError from '../../../resources/js/errors/PolicyDoesNotExistsError';
import EventBus from '../../../resources/js/services/EventBus';
import sinon from 'sinon';
import Vue from 'vue';

describe('PermissionService', () => {
  describe('setCurrentUser', () => {
    it(
      'fires an event if the current user gets set and passes the newly set user as parameter',
      async () => {
        const oldUser = PermissionService.currentUser;
        const newUser = { permissions: ['foo', 'bar'] };
        const handleUserChanged = sinon.spy();

        EventBus.$on('currentUserChangedEvent', handleUserChanged);
        PermissionService.setCurrentUser(newUser);
        await Vue.nextTick();

        sinon.assert.calledOnce(handleUserChanged);
        sinon.assert.calledWith(handleUserChanged, newUser);

        EventBus.$off('currentUserChangedEvent', handleUserChanged);

        const spy = sinon.spy();
        EventBus.$on('currentUserChangedEvent', spy);
        PermissionService.setCurrentUser(newUser, false);
        await Vue.nextTick();

        sinon.assert.notCalled(spy);

        EventBus.$off('currentUserChangedEvent', spy);
        PermissionService.setCurrentUser(oldUser);
      }
    );
  });

  describe('can', () => {
    describe('policy and method parameter', () => {
      it(
        'throws an error if the passed parameters hasn\'t the correct type',
        () => {
          expect(() => PermissionService.can({}, 'test')).toThrow(WrongTypeError);
        }
      );

      it(
        'throws an error if the policy or its method doesn\'t exists',
        () => {
          PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } });
          expect(() => PermissionService.can('test', 'test')).toThrow(new PolicyDoesNotExistsError('test', 'test'));
          expect(() => PermissionService.can('testA', 'TestPolicy')).toThrow(new PolicyDoesNotExistsError('TestPolicy', 'testA'));
          PermissionService.__ResetDependency__('Policies');
        }
      );

      it('returns the boolean value returned by the policy method', () => {
        PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } });
        expect(PermissionService.can('test', 'TestPolicy')).toEqual(true);
        PermissionService.__ResetDependency__('Policies');
      });
    });

    describe('object and method parameter', () => {
      it(
        'throws an error if the passed parameters hasn\'t the correct type',
        () => {
          expect(() => PermissionService.can({}, {})).toThrow(WrongTypeError);
        }
      );

      it(
        'throws an error if the passed object hasn\'t set the `model_name` property',
        () => {
          expect(() => PermissionService.can('test', {})).toThrow(ParameterMissingError);
          expect(() => PermissionService.can('test', { model_name: {} })).toThrow(ParameterMissingError);
        }
      );

      it(
        'throws an error if the policy for the object or its method doesn\'t exists',
        () => {
          PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } });
          expect(() => PermissionService.can('test', { model_name: 'test' })).toThrow(new PolicyDoesNotExistsError('testPolicy', 'test'));
          expect(() => PermissionService.can('testA', { model_name: 'Test' })).toThrow(new PolicyDoesNotExistsError('TestPolicy', 'testA'));
          PermissionService.__ResetDependency__('Policies');
        }
      );

      it('returns the boolean value returned by the policy method', () => {
        PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } });
        expect(PermissionService.can('test', { model_name: 'Test' })).toEqual(true);
        PermissionService.__ResetDependency__('Policies');
      });
    });
  });

  describe('cannot', () => {
    it(
      'returns the inverted boolean value of the can method and passes all arguments to it',
      () => {
        PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } });
        expect(PermissionService.cannot('test', 'TestPolicy')).toEqual(false);
        PermissionService.__ResetDependency__('Policies');
      }
    );
  });
});
