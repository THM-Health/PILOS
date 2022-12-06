import PermissionService from '../../../../resources/js/services/PermissionService';
import { shallowMount, mount } from '@vue/test-utils';
import Can from '../../../../resources/js/components/Permissions/Can.vue';
import {createContainer, createLocalVue } from '../../helper';

const localVue = createLocalVue();

const testComponent = {
  name: 'test-component',
  /* eslint-disable @intlify/vue-i18n/no-raw-text */
  template: '<p>test</p>'
};

describe('Can', () => {

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
  })

  it('hides the content if the necessary permission isn\'t available', async () => {
    const wrapper = shallowMount(Can, {
      propsData: {
        method: 'testFalse',
        policy: { model_name: 'Test' }
      },
      slots: {
        default: testComponent
      },
      localVue,
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(false);

    wrapper.destroy();
  });

  it('shows the content if the necessary permission is available', async () => {
    const wrapper = shallowMount(Can, {
      propsData: {
        method: 'testTrue',
        policy: { model_name: 'Test' }
      },
      slots: {
        default: testComponent
      },
      localVue,
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(true);

    wrapper.destroy();
  });

  it('updates state on changes of the current user of the permission service', async () => {
    const oldUser = PermissionService.currentUser;

    const wrapper = shallowMount(Can, {
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
    expect(wrapper.findComponent(testComponent).exists()).toBe(false);

    PermissionService.setCurrentUser({ permissions: ['bar'] });
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(testComponent).exists()).toBe(true);

    wrapper.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('describes from `currentUserChangedEvent` after destroy', async () => {
    const oldUser = PermissionService.currentUser;
    const spy = vi.spyOn(Can.methods, 'evaluatePermissions').mockImplementation( () => {} );

    const wrapper = shallowMount(Can, {
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
      template: '<div><can method="testTrue" policy="TestPolicy">A<test-component>Test</test-component></can></div>',
      components: {
        Can, testComponent
      },
      attachTo: createContainer()
    };

    const wrapper = mount(parentStub);

    await wrapper.vm.$nextTick();
    expect(wrapper.element.children.length).toBe(1);
    expect(wrapper.element.children[0]).toBeInstanceOf(HTMLParagraphElement);

    wrapper.destroy();
    PermissionService.setCurrentUser(oldUser);
  });
});
