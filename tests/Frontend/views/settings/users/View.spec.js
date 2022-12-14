import { createLocalVue, shallowMount } from '@vue/test-utils';
import BootstrapVue from 'bootstrap-vue';
import View from '../../../../../resources/js/views/settings/users/View.vue';
import VueRouter from 'vue-router';
import _ from 'lodash';
import ViewEditComponent from '../../../../../resources/js/components/User/ViewEditComponent.vue';
import { PiniaVuePlugin } from 'pinia';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);
localVue.use(VueRouter);

const user = {
  id: 2,
  authenticator: 'users',
  email: 'john@doe.com',
  username: 'jdo',
  firstname: 'John',
  lastname: 'Doe',
  user_locale: 'en',
  model_name: 'User',
  room_limit: -1,
  image: 'http://domain.tld/storage/profile_images/123.jpg',
  updated_at: '2020-01-01T01:00:00.000000Z',
  roles: [{
    id: 1,
    name: 'Test 1',
    automatic: true
  }, {
    id: 2,
    name: 'Test 2',
    automatic: false
  }]
};

describe('UsersView', () => {
  it('title', async () => {
    const view = shallowMount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      propsData: {
        viewOnly: false,
        id: 2
      }
    });

    const component = view.findComponent(ViewEditComponent);

    // Test without user
    expect(view.find('h3').text()).toBe('settings.users.edit:{}');

    // Trigger event to update user object
    await component.vm.$emit('updateUser', _.clone(user));
    await view.vm.$nextTick();
    // Check if title contains user first- and lastname
    expect(view.find('h3').text()).toBe('settings.users.edit:{"firstname":"John","lastname":"Doe"}');

    // Reset user object
    await view.setData({ user: null });

    // Change prop to viewOnly
    await view.setProps({ viewOnly: true });
    await view.vm.$nextTick();

    // Test without user
    expect(view.find('h3').text()).toBe('settings.users.view:{}');

    // Trigger event to update user object
    await component.vm.$emit('updateUser', _.clone(user));
    await view.vm.$nextTick();
    // Check if title contains user first- and lastname
    expect(view.find('h3').text()).toBe('settings.users.view:{"firstname":"John","lastname":"Doe"}');

    view.destroy();
  });

  it('component props', async () => {
    const view = shallowMount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      propsData: {
        viewOnly: false,
        id: 2
      }
    });

    const component = view.findComponent(ViewEditComponent);
    expect(component.exists()).toBeTruthy();

    // Check if props are correctly passed to component
    expect(component.props('viewOnly')).toBe(false);
    expect(component.props('id')).toBe(2);

    // Change props and check if they are correctly passed to component
    await view.setProps({ viewOnly: true, id: 1 });
    expect(component.props('viewOnly')).toBe(true);
    expect(component.props('id')).toBe(1);

    view.destroy();
  });
});
