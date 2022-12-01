import PermissionService from '../../../../resources/js/services/PermissionService';
import { shallowMount, mount } from '@vue/test-utils';
import Can from '../../../../resources/js/components/Permissions/Can.vue';
import { createContainer } from '../../helper';
import {nextTick} from "vue";

const testComponent = {
  name: 'test-component',
  /* eslint-disable @intlify/vue-i18n/no-raw-text */
  template: '<p>test</p>'
};

describe('Can', () => {
  it('hides the content if the necessary permission isn\'t available', async () => {
    vi.mock('@/policies/index.js', () => {
      return {
        default: {
          TestPolicy: { test: () => false }
        }
      };
    });

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

    await nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(false);

    wrapper.destroy();
  });

  it('shows the content if the necessary permission is available', async () => {
    vi.mock('@/policies/index.js', () => {
      return {
        default: {
          TestPolicy: { test: () => true }
        }
      };
    });

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

    await nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(true);

    wrapper.destroy();
  });

  it('updates state on changes of the current user of the permission service', async () => {
    vi.mock('@/policies/index.js', () => {
      return {
        default: {
          TestPolicy: { test: (ps) => ps.currentUser && ps.currentUser.permissions && ps.currentUser.permissions.includes('bar') }
        }
      };
    });
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

    await nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(false);

    PermissionService.setCurrentUser({ permissions: ['bar'] });
    await nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(true);

    wrapper.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('describes from `currentUserChangedEvent` after destroy', async () => {
    vi.mock('@/policies/index.js', () => {
      return {
        default: {
          TestPolicy: { test: () => true }
        }
      };
    });
    const oldUser = PermissionService.currentUser;
    const spy = vi.spyOn(Can.methods, 'evaluatePermissions').mockImplementation( () => {} );

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
  });

  it('component does not generate an extra html tag', async () => {
    vi.mock('@/policies/index.js', () => {
      return {
        default: {
          TestPolicy: { test: () => true }
        }
      };
    });
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

    await nextTick();
    expect(wrapper.element.children.length).toBe(1);
    expect(wrapper.element.children[0]).toBeInstanceOf(HTMLParagraphElement);

    wrapper.destroy();
    PermissionService.setCurrentUser(oldUser);
  });
});
