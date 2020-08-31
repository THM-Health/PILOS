import PermissionService from '../../../../resources/js/services/PermissionService';
import { mount } from '@vue/test-utils';
import Cannot from '../../../../resources/js/components/Permissions/Cannot';
import Vue from 'vue';
import sinon from 'sinon';

const testComponent = {
  name: 'test-component',
  /* eslint-disable @intlify/vue-i18n/no-raw-text */
  template: '<p>test</p>'
};

describe('Cannot', function () {
  it('hides the content if the necessary permission is available', async function () {
    PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } });

    const wrapper = mount(Cannot, {
      propsData: {
        method: 'test',
        policy: { modelName: 'Test' }
      },
      slots: {
        default: testComponent
      }
    });

    await Vue.nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(false);

    wrapper.destroy();
    PermissionService.__ResetDependency__('Policies');
  });

  it('shows the content if the necessary permission isn\'t available', async function () {
    PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => false } });

    const wrapper = mount(Cannot, {
      propsData: {
        method: 'test',
        policy: { modelName: 'Test' }
      },
      slots: {
        default: testComponent
      }
    });

    await Vue.nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(true);

    wrapper.destroy();
    PermissionService.__ResetDependency__('Policies');
  });

  it('updates state on changes of the current user of the permission service', async function () {
    PermissionService.__Rewire__('Policies', { TestPolicy: { test: (ps) => ps.currentUser && ps.currentUser.permissions && ps.currentUser.permissions.includes('bar') } });
    const oldUser = PermissionService.currentUser;

    const wrapper = mount(Cannot, {
      propsData: {
        method: 'test',
        policy: { modelName: 'Test' }
      },
      slots: {
        default: testComponent
      }
    });

    await Vue.nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(true);

    PermissionService.setCurrentUser({ permissions: ['bar'] });
    await Vue.nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(false);

    wrapper.destroy();
    PermissionService.setCurrentUser(oldUser);
    PermissionService.__ResetDependency__('Policies');
  });

  it('describes from `currentUserChangedEvent` after destroy', async function () {
    PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } });
    const oldUser = PermissionService.currentUser;
    const spy = sinon.spy(Cannot.methods, 'evaluatePermissions');

    const wrapper = mount(Cannot, {
      propsData: {
        method: 'test',
        policy: { modelName: 'Test' }
      },
      slots: {
        default: testComponent
      }
    });

    await Vue.nextTick();
    spy.resetHistory();
    PermissionService.setCurrentUser({ permissions: ['foo'] });

    await Vue.nextTick();
    wrapper.destroy();

    await Vue.nextTick();
    PermissionService.setCurrentUser({ permissions: ['qux'] });

    await Vue.nextTick();
    expect(spy.callCount).toEqual(1);

    wrapper.destroy();
    PermissionService.setCurrentUser(oldUser);
    PermissionService.__ResetDependency__('Policies');
  });
});
