import { shallowMount } from '@vue/test-utils';
import { PiniaVuePlugin } from 'pinia';
import { createContainer, createLocalVue } from '../../../helper';
import Profile from '@/views/Profile.vue';
import ViewEditComponent from '@/components/User/ViewEditComponent.vue';
import { BOverlay } from 'bootstrap-vue';
import { createTestingPinia } from '@pinia/testing';
import { useAuthStore } from '@/stores/auth';

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);

describe('Profile', () => {
  it('test overlay and props', async () => {
    const wrapper = shallowMount(Profile, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: (key) => key
      },
      attachTo: createContainer()
    });

    const auth = useAuthStore();

    // Test without user
    expect(wrapper.findComponent(BOverlay).props('show')).toBe(true);
    let component = wrapper.findComponent(ViewEditComponent);
    expect(component.exists()).toBeFalsy();

    // Test with logged-in user
    auth.currentUser = { id: 1, firstname: 'John', lastname: 'Doe' };
    await wrapper.vm.$nextTick();
    component = wrapper.findComponent(ViewEditComponent);
    expect(component.exists()).toBeTruthy();
    expect(component.props('id')).toBe(1);

    wrapper.destroy();
  });
});
