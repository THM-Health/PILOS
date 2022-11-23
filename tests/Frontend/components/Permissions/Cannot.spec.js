import PermissionService from '../../../../resources/js/services/PermissionService';
import { mount, shallowMount } from '@vue/test-utils';
import Cannot from '../../../../resources/js/components/Permissions/Cannot.vue';
import { createContainer } from '../../helper';

const testComponent = {
  name: 'test-component',
  /* eslint-disable @intlify/vue-i18n/no-raw-text */
  template: '<p>test</p>'
};

describe('Cannot', () => {
  it('hides the content if the necessary permission is available', async () => {
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

    await nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(false);

    wrapper.destroy();
    PermissionService.__ResetDependency__('Policies');
  });

  it('shows the content if the necessary permission isn\'t available', async () => {
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

    await nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(true);

    wrapper.destroy();
    PermissionService.__ResetDependency__('Policies');
  });

  it('updates state on changes of the current user of the permission service', async () => {
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

    await nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(true);

    PermissionService.setCurrentUser({ permissions: ['bar'] });
    await nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(false);

    wrapper.destroy();
    PermissionService.setCurrentUser(oldUser);
    PermissionService.__ResetDependency__('Policies');
  });

  it('describes from `currentUserChangedEvent` after destroy', async () => {
    PermissionService.__Rewire__('Policies', { TestPolicy: { test: () => true } });
    const oldUser = PermissionService.currentUser;
    const spy = vi.spyOn(Cannot.methods, 'evaluatePermissions').mockImplementation( () => {} );

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

    await nextTick();
    spy.mockClear();
    PermissionService.setCurrentUser({ permissions: ['foo'] });

    await nextTick();
    wrapper.destroy();

    await nextTick();
    PermissionService.setCurrentUser({ permissions: ['qux'] });

    await nextTick();
    expect(spy).toBeCalledTimes(1);

    wrapper.destroy();
    PermissionService.setCurrentUser(oldUser);
    PermissionService.__ResetDependency__('Policies');
  });

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

    await nextTick();
    expect(wrapper.element.children.length).toBe(1);
    expect(wrapper.element.children[0]).toBeInstanceOf(HTMLParagraphElement);

    wrapper.destroy();
    PermissionService.setCurrentUser(oldUser);
    PermissionService.__ResetDependency__('Policies');
  });
});
