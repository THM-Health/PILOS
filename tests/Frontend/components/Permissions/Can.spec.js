import PermissionService from '../../../../resources/js/services/PermissionService';
import { shallowMount, mount } from '@vue/test-utils';
import Can from '../../../../resources/js/components/Permissions/Can';
import Vue from 'vue';

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

describe('Can', () => {
  it('hides the content if the necessary permission isn\'t available', async () => {
    PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => false } });

    const wrapper = shallowMount(Can, {
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

  it('shows the content if the necessary permission is available', async () => {
    PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } });

    const wrapper = shallowMount(Can, {
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

  it('updates state on changes of the current user of the permission service', async () => {
    PermissionService.__Rewire__('Policies', { TestPolicy: { test: (ps) => ps.currentUser && ps.currentUser.permissions && ps.currentUser.permissions.includes('bar') } });
    const oldUser = PermissionService.currentUser;

    const wrapper = shallowMount(Can, {
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

    PermissionService.setCurrentUser({ permissions: ['bar'] });
    await Vue.nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(true);

    wrapper.destroy();
    PermissionService.setCurrentUser(oldUser);
    PermissionService.__ResetDependency__('Policies');
  }
  );

  it('describes from `currentUserChangedEvent` after destroy', async () => {
    PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } });
    const oldUser = PermissionService.currentUser;
    const spy = jest.spyOn(Can.methods, 'evaluatePermissions').mockImplementation();

    const wrapper = shallowMount(Can, {
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
    spy.mockClear();
    PermissionService.setCurrentUser({ permissions: ['foo'] });

    await Vue.nextTick();
    wrapper.destroy();

    await Vue.nextTick();
    PermissionService.setCurrentUser({ permissions: ['qux'] });

    await Vue.nextTick();
    expect(spy).toBeCalledTimes(1);

    wrapper.destroy();
    PermissionService.setCurrentUser(oldUser);
    PermissionService.__ResetDependency__('Policies');
  }
  );

  it('component does not generate an extra html tag', async () => {
    PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } });
    const oldUser = PermissionService.currentUser;

    const parentStub = {
      name: 'parentStub',
      template: '<div><can method="test" policy="TestPolicy">A<test-component>Test</test-component></can></div>',
      components: {
        Can, testComponent
      },
      attachTo: createContainer()
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
