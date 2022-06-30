import PermissionService from '../../../../resources/js/services/PermissionService';
import { mount, shallowMount } from '@vue/test-utils';
import Cannot from '../../../../resources/js/components/Permissions/Cannot';
import Vue from 'vue';
import sinon from 'sinon';

const testComponent = {
  name: 'test-component',
  /* eslint-disable @intlify/vue-i18n/no-raw-text */
  template: '<p>test</p>'
};

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

describe('Cannot', () => {
  it(
    'hides the content if the necessary permission is available',
    async () => {
      PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } });

      const wrapper = shallowMount(Cannot, {
        propsData: {
          method: 'test',
          policy: { model_name: 'Test' }
        },
        slots: {
          default: testComponent
        },
        attachTo: createContainer()
      });

      await Vue.nextTick();
      expect(wrapper.findComponent(testComponent).exists()).toBe(false);

      wrapper.destroy();
      PermissionService.__ResetDependency__('Policies');
    }
  );

  it(
    'shows the content if the necessary permission isn\'t available',
    async () => {
      PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => false } });

      const wrapper = shallowMount(Cannot, {
        propsData: {
          method: 'test',
          policy: { model_name: 'Test' }
        },
        slots: {
          default: testComponent
        },
        attachTo: createContainer()
      });

      await Vue.nextTick();
      expect(wrapper.findComponent(testComponent).exists()).toBe(true);

      wrapper.destroy();
      PermissionService.__ResetDependency__('Policies');
    }
  );

  it(
    'updates state on changes of the current user of the permission service',
    async () => {
      PermissionService.__Rewire__('Policies', { TestPolicy: { test: (ps) => ps.currentUser && ps.currentUser.permissions && ps.currentUser.permissions.includes('bar') } });
      const oldUser = PermissionService.currentUser;

      const wrapper = shallowMount(Cannot, {
        propsData: {
          method: 'test',
          policy: { model_name: 'Test' }
        },
        slots: {
          default: testComponent
        },
        attachTo: createContainer()
      });

      await Vue.nextTick();
      expect(wrapper.findComponent(testComponent).exists()).toBe(true);

      PermissionService.setCurrentUser({ permissions: ['bar'] });
      await Vue.nextTick();
      expect(wrapper.findComponent(testComponent).exists()).toBe(false);

      wrapper.destroy();
      PermissionService.setCurrentUser(oldUser);
      PermissionService.__ResetDependency__('Policies');
    }
  );

  it(
    'describes from `currentUserChangedEvent` after destroy',
    async () => {
      PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } });
      const oldUser = PermissionService.currentUser;
      const spy = sinon.spy(Cannot.methods, 'evaluatePermissions');

      const wrapper = shallowMount(Cannot, {
        propsData: {
          method: 'test',
          policy: { model_name: 'Test' }
        },
        slots: {
          default: testComponent
        },
        attachTo: createContainer()
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
    }
  );

  it('component does not generate an extra html tag', async () => {
    PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => false } });
    const oldUser = PermissionService.currentUser;

    const parentStub = {
      name: 'parentStub',
      template: '<div><cannot method="test" policy="TestPolicy">A<test-component>Test</test-component></cannot></div>',
      components: {
        Cannot, testComponent
      }
    };

    const wrapper = mount(parentStub);

    await Vue.nextTick();
    expect(wrapper.element.children.length).toBe(1);
    expect(wrapper.element.children[0]).toBeInstanceOf(HTMLParagraphElement);

    wrapper.destroy();
    PermissionService.setCurrentUser(oldUser);
    PermissionService.__ResetDependency__('Policies');
  });
});
