import View from '@/views/settings/servers/View.vue';
import { mount } from '@vue/test-utils';
import PermissionService from '@/services/PermissionService';

import BootstrapVue, {

  BFormInput,
  BOverlay,
  BButton, BForm, BFormInvalidFeedback, BModal, BFormRating, BFormCheckbox, BFormText
} from 'bootstrap-vue';
import Base from '@/api/base';
import VueRouter from 'vue-router';
import env from '@/env';
import _ from 'lodash';
import { mockAxios, createContainer, createLocalVue } from '../../../helper';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(VueRouter);

let oldUser;

describe('ServerView', () => {
  beforeEach(() => {
    oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser({ permissions: ['servers.view', 'servers.create', 'servers.update', 'settings.manage'] });
    mockAxios.reset();

    const serverResponse = {
      data: {
        id: 1,
        name: 'Server 01',
        description: 'Testserver 01',
        base_url: 'https://localhost/bigbluebutton',
        secret: '123456789',
        strength: 1,
        status: 1,
        participant_count: 14,
        listener_count: 7,
        voice_participant_count: 7,
        video_count: 7,
        meeting_count: 3,
        version: '2.4.5',
        model_name: 'Server',
        updated_at: '2020-12-21T13:43:21.000000Z'
      }
    };

    mockAxios.request('/api/v1/servers/1').respondWith({
      status: 200,
      data: serverResponse
    });
  });

  afterEach(() => {
    PermissionService.setCurrentUser(oldUser);
  });

  it('input fields are disabled if the server is displayed in view mode', async () => {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: true,
        id: '1'
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    expect(view.findAllComponents(BFormInput).wrappers.every(input => input.attributes('disabled'))).toBe(true);
    expect(view.findAllComponents(BFormRating).wrappers.every(input => input.vm.disabled)).toBe(true);
    expect(view.findAllComponents(BFormCheckbox).wrappers.every(input => input.vm.disabled)).toBe(true);
    view.destroy();
  });

  it('error handler gets called if an error occurs during load of data and reload button reloads data', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    mockAxios.reset();
    mockAxios.request('/api/v1/servers/1').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    expect(spy).toBeCalledTimes(1);
    expect(view.vm.isBusy).toBe(false);
    expect(view.findComponent(BOverlay).props('show')).toBe(true);

    mockAxios.request('/api/v1/servers/1').respondWith({
      status: 200,
      data: {
        data: {
          id: 1,
          name: 'Server 01',
          description: 'Testserver 01',
          base_url: 'https://localhost/bigbluebutton',
          secret: '123456789',
          strength: 1,
          status: 1,
          participant_count: 14,
          listener_count: 7,
          voice_participant_count: 7,
          video_count: 7,
          meeting_count: 3,
          version: '2.4.5',
          model_name: 'Server',
          updated_at: '2020-12-21T13:43:21.000000Z'
        }
      }
    });

    const reloadButton = view.findComponent({ ref: 'reloadServer' });
    expect(reloadButton.exists()).toBeTruthy();
    reloadButton.trigger('click');

    await mockAxios.wait();
    expect(view.vm.isBusy).toBe(false);
    expect(view.findComponent(BOverlay).props('show')).toBe(false);

    expect(view.vm.$data.model.id).toBe(1);
    expect(view.vm.$data.model.name).toEqual('Server 01');
    view.destroy();
  });

  it('error handler gets called and redirected if a 404 error occurs during load of data', async () => {
    const routerSpy = vi.fn();
    const router = new VueRouter();
    router.push = routerSpy;

    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    mockAxios.reset();
    mockAxios.request('/api/v1/servers/1').respondWith({
      status: 404,
      data: {
        message: 'Test'
      }
    });

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      router,
      attachTo: createContainer()
    });

    await mockAxios.wait();
    expect(spy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'settings.servers' });

    view.destroy();
  });

  it('error handler gets called and redirected if a 404 error occurs during save of data', async () => {
    const routerSpy = vi.fn();
    const router = new VueRouter();
    router.push = routerSpy;

    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      router,
      attachTo: createContainer()
    });

    await mockAxios.wait();

    mockAxios.request('/api/v1/servers/1').respondWith({
      status: 404,
      data: {
        message: 'Test'
      }
    });

    view.findComponent(BForm).trigger('submit');

    await mockAxios.wait();
    expect(spy).toBeCalledTimes(1);

    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'settings.servers' });

    view.destroy();
  });

  it('error handler gets called if an error occurs during update', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    mockAxios.request('/api/v1/servers/1').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    view.findComponent(BForm).trigger('submit');

    await mockAxios.wait();
    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('back button causes a back navigation without persistence', async () => {
    const spy = vi.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      router,
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.findAllComponents(BButton).filter(button => button.text() === 'app.back').at(0).trigger('click');

    expect(spy).toBeCalledTimes(1);
    view.destroy();
  });

  it('request with updates get send during saving the server', async () => {
    const spy = vi.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      router,
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();
    await view.findAllComponents(BFormInput).at(0).setValue('Server 01');
    await view.findAllComponents(BFormInput).at(1).setValue('Testserver 01');
    await view.findAllComponents(BFormInput).at(3).setValue('http://localhost/bbb');
    await view.findAllComponents(BFormInput).at(4).setValue('987654321');
    await view.findComponent(BFormRating).findAll('.b-rating-star').at(4).trigger('click');
    await view.findComponent(BFormCheckbox).find('input').setChecked();

    const saveRequest = mockAxios.request('/api/v1/servers/1');

    view.findComponent(BForm).trigger('submit');

    await saveRequest.wait();
    const data = JSON.parse(saveRequest.config.data);

    expect(data.name).toBe('Server 01');
    expect(data.description).toBe('Testserver 01');
    expect(data.base_url).toBe('http://localhost/bbb');
    expect(data.secret).toBe('987654321');
    expect(data.strength).toBe(5);
    expect(data.disabled).toBe(true);

    await saveRequest.respondWith({
      status: env.HTTP_UNPROCESSABLE_ENTITY,
      data: {
        message: 'The given data was invalid.',
        errors: {
          name: ['Test name'],
          description: ['Test description'],
          base_url: ['Test base url'],
          secret: ['Test secret'],
          strength: ['Test strength'],
          disabled: ['Test disabled']
        }
      }
    });

    const feedback = view.findAllComponents(BFormInvalidFeedback).wrappers;
    expect(feedback[0].html()).toContain('Test name');
    expect(feedback[1].html()).toContain('Test description');
    expect(feedback[2].html()).toContain('Test base url');
    expect(feedback[3].html()).toContain('Test secret');
    expect(feedback[4].html()).toContain('Test strength');
    expect(feedback[5].html()).toContain('Test disabled');

    mockAxios.request('/api/v1/servers/1').respondWith({
      status: 204
    });

    view.findComponent(BForm).trigger('submit');

    await mockAxios.wait();
    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('modal gets shown for stale errors and a overwrite can be forced', async () => {
    const spy = vi.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: false,
        id: '1',
        modalStatic: true
      },
      router,
      attachTo: createContainer()
    });

    await mockAxios.wait();
    const newModel = _.cloneDeep(view.vm.model);
    newModel.updated_at = '2020-09-08T16:13:26.000000Z';

    mockAxios.request('/api/v1/servers/1').respondWith({
      status: env.HTTP_STALE_MODEL,
      data: {
        error: env.HTTP_STALE_MODEL,
        message: 'test',
        new_model: newModel
      }
    });

    view.findComponent(BForm).trigger('submit');

    await mockAxios.wait();
    const staleModelModal = view.findComponent({ ref: 'stale-server-modal' });
    expect(staleModelModal.vm.$data.isVisible).toBe(true);

    const saveRequest = mockAxios.request('/api/v1/servers/1');

    staleModelModal.vm.$refs['ok-button'].click();

    await saveRequest.wait();
    const data = JSON.parse(saveRequest.config.data);
    expect(data.updated_at).toBe(newModel.updated_at);

    await saveRequest.respondWith({
      status: 204
    });

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);

    view.destroy();
  });

  it('modal gets shown for stale errors and the new model can be applied to current form', async () => {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: false,
        id: '1',
        modalStatic: true
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    const newModel = _.cloneDeep(view.vm.model);
    newModel.updated_at = '2020-09-08T16:13:26.000000Z';
    newModel.name = 'Server 02';

    mockAxios.request('/api/v1/servers/1').respondWith({
      status: env.HTTP_STALE_MODEL,
      data: {
        error: env.HTTP_STALE_MODEL,
        message: 'test',
        new_model: newModel
      }
    });

    view.findComponent(BForm).trigger('submit');

    await mockAxios.wait();
    const staleModelModal = view.findComponent({ ref: 'stale-server-modal' });
    expect(staleModelModal.vm.$data.isVisible).toBe(true);
    expect(view.findAllComponents(BFormInput).at(0).element.value).toBe('Server 01');

    staleModelModal.vm.$refs['cancel-button'].click();

    await view.vm.$nextTick();
    expect(view.findAllComponents(BFormInput).at(0).element.value).toBe('Server 02');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    view.destroy();
  });

  it('show correct status on page load', async () => {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      attachTo: createContainer()
    });

    // response server online
    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent(BFormCheckbox).find('input').element.checked).toBeFalsy();
    expect(view.findAllComponents(BFormInput).at(5).element.value).toBe('settings.servers.online');

    mockAxios.request('/api/v1/servers/1').respondWith({
      status: 200,
      data: {
        data: {
          id: 1,
          name: 'Server 01',
          description: 'Testserver 01',
          base_url: 'https://localhost/bigbluebutton',
          secret: '123456789',
          strength: 1,
          status: 0,
          participant_count: 14,
          listener_count: 7,
          voice_participant_count: 7,
          video_count: 7,
          meeting_count: 3,
          version: '2.4.5',
          model_name: 'Server',
          updated_at: '2020-12-21T13:43:21.000000Z'
        }
      }
    });

    view.vm.load();

    // response server offline
    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent(BFormCheckbox).find('input').element.checked).toBeFalsy();
    expect(view.findAllComponents(BFormInput).at(5).element.value).toBe('settings.servers.offline');

    mockAxios.request('/api/v1/servers/1').respondWith({
      status: 200,
      data: {
        data: {
          id: 1,
          name: 'Server 01',
          description: 'Testserver 01',
          base_url: 'https://localhost/bigbluebutton',
          secret: '123456789',
          strength: 1,
          status: -1,
          participant_count: 14,
          listener_count: 7,
          voice_participant_count: 7,
          video_count: 7,
          meeting_count: 3,
          version: '2.4.5',
          model_name: 'Server',
          updated_at: '2020-12-21T13:43:21.000000Z'
        }
      }
    });

    view.vm.load();

    // response server disabled
    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent(BFormCheckbox).find('input').element.checked).toBeTruthy();
    expect(view.findAllComponents(BFormInput).at(5).element.value).toBe('settings.servers.unknown');

    view.destroy();
  });

  it('update connection status', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    let request = mockAxios.request('/api/v1/servers/check');

    // Check for invalid connection
    await view.findAllComponents(BButton).at(1).trigger('click');
    await request.wait();
    expect(request.config.method).toBe('post');
    const data = JSON.parse(request.config.data);
    expect(data.base_url).toBe('https://localhost/bigbluebutton');
    expect(data.secret).toBe('123456789');
    await request.respondWith({
      status: 200,
      data: {
        connection_ok: false,
        secret_ok: false
      }
    });

    await view.vm.$nextTick();
    expect(view.findAllComponents(BFormInput).at(5).element.value).toBe('settings.servers.offline');
    expect(view.findAllComponents(BFormText).length).toBe(3);
    expect(view.findAllComponents(BFormText).at(2).html()).toContain('settings.servers.offline_reason.connection');

    request = mockAxios.request('/api/v1/servers/check');

    // check for invalid secret
    await view.findAllComponents(BButton).at(1).trigger('click');
    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        connection_ok: true,
        secret_ok: false
      }
    });

    await view.vm.$nextTick();
    expect(view.findAllComponents(BFormInput).at(5).element.value).toBe('settings.servers.offline');
    expect(view.findAllComponents(BFormText).length).toBe(3);
    expect(view.findAllComponents(BFormText).at(2).html()).toContain('settings.servers.offline_reason.secret');

    request = mockAxios.request('/api/v1/servers/check');

    // check for valid connection
    await view.findAllComponents(BButton).at(1).trigger('click');
    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        connection_ok: true,
        secret_ok: true
      }
    });

    await view.vm.$nextTick();
    expect(view.findAllComponents(BFormInput).at(5).element.value).toBe('settings.servers.online');
    expect(view.findAllComponents(BFormText).length).toBe(2);

    request = mockAxios.request('/api/v1/servers/check');

    // check for response errors
    await view.findAllComponents(BButton).at(1).trigger('click');
    await request.wait();
    await request.respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    await view.vm.$nextTick();
    expect(view.findAllComponents(BFormInput).at(5).element.value).toBe('settings.servers.unknown');
    expect(view.findAllComponents(BFormText).length).toBe(2);

    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('show usage data only if viewOnly and server enabled', async () => {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'currentUsage' }).exists()).toBe(false);
    await view.setProps({ viewOnly: true });
    expect(view.findComponent({ ref: 'currentUsage' }).exists()).toBe(true);
    await view.setProps({ viewOnly: false });

    mockAxios.request('/api/v1/servers/1').respondWith({
      status: 200,
      data: {
        data: {
          id: 1,
          name: 'Server 01',
          description: 'Testserver 01',
          base_url: 'https://localhost/bigbluebutton',
          secret: '123456789',
          strength: 1,
          status: -1,
          participant_count: 14,
          listener_count: 7,
          voice_participant_count: 7,
          video_count: 7,
          meeting_count: 3,
          version: '2.4.5',
          model_name: 'Server',
          updated_at: '2020-12-21T13:43:21.000000Z'
        }
      }
    });
    view.vm.load();

    await mockAxios.wait();
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'currentUsage' }).exists()).toBe(false);
    await view.setProps({ viewOnly: true });
    expect(view.findComponent({ ref: 'currentUsage' }).exists()).toBe(false);

    view.destroy();
  });

  it('show panic button only if user has permission', async () => {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: true,
        id: '1'
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'currentUsage' }).find('button').exists()).toBe(true);
    PermissionService.setCurrentUser({ permissions: ['servers.view', 'servers.create', 'settings.manage'] });
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'currentUsage' }).find('button').exists()).toBe(false);
    view.destroy();
  });

  it('panic button calls api and gets disabled while running', async () => {
    const toastSuccessSpy = vi.fn();

    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        toastSuccess: toastSuccessSpy
      },
      propsData: {
        viewOnly: true,
        id: '1'
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();
    const button = view.findComponent({ ref: 'currentUsage' }).find('button');

    let panicRequest = mockAxios.request('/api/v1/servers/1/panic');
    const reloadRequest = mockAxios.request('/api/v1/servers/1');

    await button.trigger('click');

    expect(button.attributes('disabled')).toBe('disabled');

    // check success
    await panicRequest.wait();
    expect(panicRequest.config.method).toBe('get');
    await panicRequest.respondWith({
      status: 200,
      data: {
        total: 5,
        success: 3
      }
    });

    // check reload of server data
    await reloadRequest.wait();
    expect(reloadRequest.config.method).toBe('get');
    await reloadRequest.respondWith({
      status: 200,
      data: {
        data: {
          id: 1,
          name: 'Server 01',
          description: 'Testserver 01',
          base_url: 'https://localhost/bigbluebutton',
          secret: '123456789',
          strength: 1,
          status: 1,
          participant_count: 14,
          listener_count: 7,
          voice_participant_count: 7,
          video_count: 7,
          meeting_count: 3,
          version: '2.4.5',
          model_name: 'Server',
          updated_at: '2020-12-21T13:43:21.000000Z'
        }
      }
    });

    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'currentUsage' }).find('button').attributes('disabled')).toBeUndefined();

    expect(toastSuccessSpy).toBeCalledTimes(1);
    expect(toastSuccessSpy).toBeCalledWith(
      'settings.servers.flash.panic.description:{"total":5,"success":3}',
      'settings.servers.flash.panic.title'
    );

    // check error handling
    panicRequest = mockAxios.request('/api/v1/servers/1/panic');
    await button.trigger('click');
    await panicRequest.wait();
    expect(panicRequest.config.url).toBe('/api/v1/servers/1/panic');
    expect(panicRequest.config.method).toBe('get');
    await panicRequest.respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'currentUsage' }).find('button').attributes('disabled')).toBeUndefined();
    expect(spy).toBeCalledTimes(1);
    view.destroy();
  });
});
