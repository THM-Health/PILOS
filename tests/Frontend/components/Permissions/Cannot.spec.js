import PermissionService from '@/services/PermissionService';
import { mount, shallowMount } from '@vue/test-utils';
import Cannot from '@/components/Permissions/Cannot.vue';
import { createContainer } from '../../helper';

const testComponent = {
  name: 'test-component',
  /* eslint-disable @intlify/vue-i18n/no-raw-text */
  template: '<p>test</p>'
};

describe('Cannot', () => {
  afterEach(() => {
    vi.mock('@/policies/index', () => {
      return {
        default: {
          TestPolicy: {
            testFalse: () => false,
            testTrue: () => true,
            testUser: (ps) => ps.currentUser && ps.currentUser.permissions && ps.currentUser.permissions.includes('bar')
          }
        }
      };
    });
  });

  it('hides the content if the necessary permission is available', async () => {
    const wrapper = shallowMount(Cannot, {
      propsData: {
        method: 'testTrue',
        policy: { model_name: 'Test' }
      },
      slots: {
        default: testComponent
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(false);

    wrapper.destroy();
  });

  it('shows the content if the necessary permission isn\'t available', async () => {
    const wrapper = shallowMount(Cannot, {
      propsData: {
        method: 'testFalse',
        policy: { model_name: 'Test' }
      },
      slots: {
        default: testComponent
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(true);

    wrapper.destroy();
  });

  it('updates state on changes of the current user of the permission service', async () => {
    const oldUser = PermissionService.currentUser;

    const wrapper = shallowMount(Cannot, {
      propsData: {
        method: 'testUser',
        policy: { model_name: 'Test' }
      },
      slots: {
        default: testComponent
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(true);

    PermissionService.setCurrentUser({ permissions: ['bar'] });
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(false);

    wrapper.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('describes from `currentUserChangedEvent` after destroy', async () => {
    const oldUser = PermissionService.currentUser;
    const spy = vi.spyOn(Cannot.methods, 'evaluatePermissions').mockImplementation(() => {});

    const wrapper = shallowMount(Cannot, {
      propsData: {
        method: 'testTrue',
        policy: { model_name: 'Test' }
      },
      slots: {
        default: testComponent
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();
    spy.mockClear();
    PermissionService.setCurrentUser({ permissions: ['foo'] });

    await wrapper.vm.$nextTick();
    wrapper.destroy();

    await wrapper.vm.$nextTick();
    PermissionService.setCurrentUser({ permissions: ['qux'] });

    await wrapper.vm.$nextTick();
    expect(spy).toBeCalledTimes(1);

    wrapper.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('component does not generate an extra html tag', async () => {
    const oldUser = PermissionService.currentUser;

    const parentStub = {
      name: 'parentStub',
      template: '<div><cannot method="testFalse" policy="TestPolicy">A<test-component>Test</test-component></cannot></div>',
      components: {
        Cannot, testComponent
      }
    };

    const wrapper = mount(parentStub);

    await wrapper.vm.$nextTick();
    expect(wrapper.element.children.length).toBe(1);
    expect(wrapper.element.children[0]).toBeInstanceOf(HTMLParagraphElement);

    wrapper.destroy();
    PermissionService.setCurrentUser(oldUser);
  });
});
