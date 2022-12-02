import moxios from 'moxios';
import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BButton, BFormInput, BFormInvalidFeedback } from 'bootstrap-vue';
import VueRouter from 'vue-router';
import PasswordReset from '../../../resources/js/views/PasswordReset';
import Base from '../../../resources/js/api/base';
import env from '../../../resources/js/env';
import { waitMoxios } from '../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import {useLocaleStore} from '../../../resources/js/stores/locale';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);
localVue.use(VueRouter);

describe('PasswordReset', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('submit handles errors correctly', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();

    const view = mount(PasswordReset, {
      localVue,
      mocks: {
        $t: (key) => key
      }
    });

    view.findComponent(BButton).trigger('submit');
    await waitMoxios();
    await moxios.requests.mostRecent().respondWith({
      status: env.HTTP_UNPROCESSABLE_ENTITY,
      response: {
        errors: {
          password: ['Error Password'],
          password_confirmation: ['Error Password Confirmation'],
          email: ['Error Email'],
          token: ['Error Token']
        }
      }
    });
    const feedBacks = view.findAllComponents(BFormInvalidFeedback);
    expect(feedBacks.at(0).html()).toContain('Error Password');
    expect(feedBacks.at(1).html()).toContain('Error Password Confirmation');
    expect(feedBacks.at(2).html()).toContain('Error Email');
    expect(feedBacks.at(3).html()).toContain('Error Token');

    view.findComponent(BButton).trigger('submit');
    await waitMoxios();
    await moxios.requests.mostRecent().respondWith({
      status: 500,
      response: {
        message: 'Internal server error'
      }
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0].response.status).toEqual(500);
  });

  it('submit loads the current user after login and changes the application language to the corresponding one', async () => {
    const router = new VueRouter();
    const routerSpy = jest.spyOn(router, 'push').mockImplementation();

    const flashMessageSpy = jest.fn();
    const flashMessage = { success: flashMessageSpy };

    const view = mount(PasswordReset, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      router,
      pinia: createTestingPinia( { stubActions: false}),
      propsData: {
        email: 'foo@bar.com',
        token: 'Test123'
      }
    });

    const localeStore = useLocaleStore();

    const inputs = view.findAllComponents(BFormInput);
    await inputs.at(0).setValue('Test123');
    await inputs.at(1).setValue('Test123');
    await view.findComponent(BButton).trigger('submit');

    await waitMoxios();
    await moxios.requests.mostRecent().respondWith({
      status: 200
    });
    await waitMoxios();
    let request = moxios.requests.mostRecent();
    const data = JSON.parse(request.config.data);
    expect(data.email).toBe('foo@bar.com');
    expect(data.token).toBe('Test123');
    expect(data.password).toBe('Test123');
    expect(data.password_confirmation).toBe('Test123');

    await request.respondWith({
      status: 200,
      response: {
        message: 'Success!'
      }
    });

    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy).toBeCalledWith('Success!');

    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/currentUser');
    await request.respondWith({
      status: 200,
      response: {
        data: {
          id: 1,
          authenticator: 'ldap',
          email: 'john.doe@domain.tld',
          username: 'user',
          firstname: 'John',
          lastname: 'Doe',
          user_locale: 'de',
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    });

    expect(localeStore.currentLocale).toEqual('de');

    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'home' });

    view.destroy();
  });
});
