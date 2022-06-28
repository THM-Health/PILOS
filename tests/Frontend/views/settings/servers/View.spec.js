import View from '../../../../../resources/js/views/settings/servers/View';
import { createLocalVue, mount } from '@vue/test-utils';
import PermissionService from '../../../../../resources/js/services/PermissionService';
import moxios from 'moxios';
import BootstrapVue, {

  BFormInput,
  BOverlay,
  BButton, BForm, BFormInvalidFeedback, BModal, BFormRating, BFormCheckbox, BFormText
} from 'bootstrap-vue';
import Vuex from 'vuex';
import sinon from 'sinon';
import Base from '../../../../../resources/js/api/base';
import VueRouter from 'vue-router';
import env from '../../../../../resources/js/env';
import _ from 'lodash';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(Vuex);
localVue.use(VueRouter);

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      getters: {
        settings: () => (setting) => setting === 'room_limit' ? -1 : null
      }
    }
  }
});

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

function overrideStub (url, response) {
  const l = moxios.stubs.count();
  for (let i = 0; i < l; i++) {
    const stub = moxios.stubs.at(i);
    if (stub.url === url) {
      const oldResponse = stub.response;
      const restoreFunc = () => { stub.response = oldResponse; };

      stub.response = response;
      return restoreFunc;
    }
  }
}

let oldUser;

describe('ServerView', function () {
  beforeEach(function () {
    oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser({ permissions: ['servers.view', 'servers.create', 'servers.update', 'settings.manage'] });
    moxios.install();

    const serverResponse = {
      data: {
        id: 1,
        name: 'Server 01',
        description: 'Testserver 01',
        base_url: 'https://localhost/bigbluebutton',
        salt: '123456789',
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

    moxios.stubRequest('/api/v1/servers/1', {
      status: 200,
      response: serverResponse
    });
  });

  afterEach(function () {
    PermissionService.setCurrentUser(oldUser);
    moxios.uninstall();
  });

  it('input fields are disabled if the server is displayed in view mode', function (done) {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: true,
        id: '1'
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      expect(view.findAllComponents(BFormInput).wrappers.every(input => input.attributes('disabled'))).toBe(true);
      expect(view.findAllComponents(BFormRating).wrappers.every(input => input.vm.disabled)).toBe(true);
      expect(view.findAllComponents(BFormCheckbox).wrappers.every(input => input.vm.disabled)).toBe(true);
      done();
    });
  });

  it('error handler gets called if an error occurs during load of data and reload button reloads data', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const restoreServerResponse = overrideStub('/api/v1/servers/1', {
      status: 500,
      response: {
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
      store,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      sinon.assert.calledOnce(Base.error);
      expect(view.vm.isBusy).toBe(false);
      expect(view.findComponent(BOverlay).props('show')).toBe(true);
      Base.error.restore();
      restoreServerResponse();

      const reloadButton = view.findComponent({ ref: 'reloadServer' });
      expect(reloadButton.exists()).toBeTruthy();
      reloadButton.trigger('click');

      moxios.wait(function () {
        expect(view.vm.isBusy).toBe(false);
        expect(view.findComponent(BOverlay).props('show')).toBe(false);

        expect(view.vm.$data.model.id).toBe(1);
        expect(view.vm.$data.model.name).toEqual('Server 01');

        done();
      });
    });
  });

  it('error handler gets called and redirected if a 404 error occurs during load of data', function (done) {
    const routerSpy = sinon.spy();
    const router = new VueRouter();
    router.push = routerSpy;

    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const restoreServerResponse = overrideStub('/api/v1/servers/1', {
      status: 404,
      response: {
        message: 'Test'
      }
    });

    mount(View, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      store,
      router,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      sinon.assert.calledOnce(Base.error);
      sinon.assert.calledOnce(routerSpy);
      sinon.assert.calledWith(routerSpy, { name: 'settings.servers' });
      Base.error.restore();
      restoreServerResponse();

      done();
    });
  });

  it('error handler gets called and redirected if a 404 error occurs during save of data', function (done) {
    const routerSpy = sinon.spy();
    const router = new VueRouter();
    router.push = routerSpy;

    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      store,
      router,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      const restoreServerResponse = overrideStub('/api/v1/servers/1', {
        status: 404,
        response: {
          message: 'Test'
        }
      });

      view.findComponent(BForm).trigger('submit');

      moxios.wait(function () {
        sinon.assert.calledOnce(Base.error);
        Base.error.restore();
        sinon.assert.calledOnce(routerSpy);
        sinon.assert.calledWith(routerSpy, { name: 'settings.servers' });
        restoreServerResponse();
        done();
      });
    });
  });

  it('error handler gets called if an error occurs during update', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      const restoreServerResponse = overrideStub('/api/v1/servers/1', {
        status: 500,
        response: {
          message: 'Test'
        }
      });

      view.findComponent(BForm).trigger('submit');

      moxios.wait(function () {
        sinon.assert.calledOnce(Base.error);
        Base.error.restore();
        restoreServerResponse();
        done();
      });
    });
  });

  it('back button causes a back navigation without persistence', function (done) {
    const spy = sinon.spy();

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
      store,
      router,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      const requestCount = moxios.requests.count();

      view.findAllComponents(BButton).filter(button => button.text() === 'app.back').at(0).trigger('click').then(() => {
        expect(moxios.requests.count()).toBe(requestCount);
        sinon.assert.calledOnce(spy);
        done();
      });
    });
  });

  it('request with updates get send during saving the server', function (done) {
    const spy = sinon.spy();

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
      store,
      router,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      await view.findAllComponents(BFormInput).at(0).setValue('Server 01');
      await view.findAllComponents(BFormInput).at(1).setValue('Testserver 01');
      await view.findAllComponents(BFormInput).at(3).setValue('http://localhost/bbb');
      await view.findAllComponents(BFormInput).at(4).setValue('987654321');
      await view.findComponent(BFormRating).findAll('.b-rating-star').at(4).trigger('click');
      await view.findComponent(BFormCheckbox).find('input').setChecked();

      view.findComponent(BForm).trigger('submit');

      let restoreServerResponse = overrideStub('/api/v1/servers/1', {
        status: env.HTTP_UNPROCESSABLE_ENTITY,
        response: {
          message: 'The given data was invalid.',
          errors: {
            name: ['Test name'],
            description: ['Test description'],
            base_url: ['Test base url'],
            salt: ['Test salt'],
            strength: ['Test strength'],
            disabled: ['Test disabled']
          }
        }
      });

      moxios.wait(function () {
        const request = moxios.requests.mostRecent();
        const data = JSON.parse(request.config.data);

        expect(data.name).toBe('Server 01');
        expect(data.description).toBe('Testserver 01');
        expect(data.base_url).toBe('http://localhost/bbb');
        expect(data.salt).toBe('987654321');
        expect(data.strength).toBe(5);
        expect(data.disabled).toBe(true);

        const feedback = view.findAllComponents(BFormInvalidFeedback).wrappers;
        expect(feedback[0].html()).toContain('Test name');
        expect(feedback[1].html()).toContain('Test description');
        expect(feedback[2].html()).toContain('Test base url');
        expect(feedback[3].html()).toContain('Test salt');
        expect(feedback[4].html()).toContain('Test strength');
        expect(feedback[5].html()).toContain('Test disabled');

        restoreServerResponse();
        restoreServerResponse = overrideStub('/api/v1/servers/1', {
          status: 204
        });

        view.findComponent(BForm).trigger('submit');

        moxios.wait(function () {
          sinon.assert.calledOnce(spy);
          restoreServerResponse();
          done();
        });
      });
    });
  });

  it('modal gets shown for stale errors and a overwrite can be forced', function (done) {
    const spy = sinon.spy();

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
      store,
      router,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      const newModel = _.cloneDeep(view.vm.model);
      newModel.updated_at = '2020-09-08T16:13:26.000000Z';

      let restoreServerResponse = overrideStub('/api/v1/servers/1', {
        status: env.HTTP_STALE_MODEL,
        response: {
          error: env.HTTP_STALE_MODEL,
          message: 'test',
          new_model: newModel
        }
      });

      view.findComponent(BForm).trigger('submit');

      moxios.wait(function () {
        const staleModelModal = view.findComponent({ ref: 'stale-server-modal' });
        expect(staleModelModal.vm.$data.isVisible).toBe(true);

        restoreServerResponse();
        restoreServerResponse = overrideStub('/api/v1/servers/1', {
          status: 204
        });

        staleModelModal.vm.$refs['ok-button'].click();

        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          const data = JSON.parse(request.config.data);

          expect(data.updated_at).toBe(newModel.updated_at);
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
          restoreServerResponse();
          done();
        });
      });
    });
  });

  it('modal gets shown for stale errors and the new model can be applied to current form', function (done) {
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
      store,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      const newModel = _.cloneDeep(view.vm.model);
      newModel.updated_at = '2020-09-08T16:13:26.000000Z';
      newModel.name = 'Server 02';

      const restoreServerResponse = overrideStub('/api/v1/servers/1', {
        status: env.HTTP_STALE_MODEL,
        response: {
          error: env.HTTP_STALE_MODEL,
          message: 'test',
          new_model: newModel
        }
      });

      view.findComponent(BForm).trigger('submit');

      moxios.wait(function () {
        const staleModelModal = view.findComponent({ ref: 'stale-server-modal' });
        expect(staleModelModal.vm.$data.isVisible).toBe(true);
        expect(view.findAllComponents(BFormInput).at(0).element.value).toBe('Server 01');

        restoreServerResponse();

        staleModelModal.vm.$refs['cancel-button'].click();

        view.vm.$nextTick().then(() => {
          expect(view.findAllComponents(BFormInput).at(0).element.value).toBe('Server 02');
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
          done();
        });
      });
    });
  });

  it('show correct status on page load', function (done) {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      // response server online
      await view.vm.$nextTick();

      expect(view.findComponent(BFormCheckbox).find('input').element.checked).toBeFalsy();
      expect(view.findAllComponents(BFormInput).at(5).element.value).toBe('settings.servers.online');

      let restoreServerResponse = overrideStub('/api/v1/servers/1', {
        status: 200,
        response: {
          data: {
            id: 1,
            name: 'Server 01',
            description: 'Testserver 01',
            base_url: 'https://localhost/bigbluebutton',
            salt: '123456789',
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

      moxios.wait(async () => {
        // response server offline
        await view.vm.$nextTick();

        expect(view.findComponent(BFormCheckbox).find('input').element.checked).toBeFalsy();
        expect(view.findAllComponents(BFormInput).at(5).element.value).toBe('settings.servers.offline');

        restoreServerResponse();
        restoreServerResponse = overrideStub('/api/v1/servers/1', {
          status: 200,
          response: {
            data: {
              id: 1,
              name: 'Server 01',
              description: 'Testserver 01',
              base_url: 'https://localhost/bigbluebutton',
              salt: '123456789',
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

        moxios.wait(async () => {
          // response server disabled
          await view.vm.$nextTick();

          expect(view.findComponent(BFormCheckbox).find('input').element.checked).toBeTruthy();
          expect(view.findAllComponents(BFormInput).at(5).element.value).toBe('settings.servers.unknown');

          restoreServerResponse();
          view.destroy();
          done();
        });
      });
    });
  });

  it('update connection status', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();

      // Check for invalid connection
      await view.findAllComponents(BButton).at(1).trigger('click');
      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.url).toBe('/api/v1/servers/check');
        expect(request.config.method).toBe('post');
        const data = JSON.parse(request.config.data);
        expect(data.base_url).toBe('https://localhost/bigbluebutton');
        expect(data.salt).toBe('123456789');
        await request.respondWith({
          status: 200,
          response: {
            connection_ok: false,
            salt_ok: false
          }
        });

        await view.vm.$nextTick();
        expect(view.findAllComponents(BFormInput).at(5).element.value).toBe('settings.servers.offline');
        expect(view.findAllComponents(BFormText).length).toBe(3);
        expect(view.findAllComponents(BFormText).at(2).html()).toContain('settings.servers.offlineReason.connection');

        // check for invalid salt
        await view.findAllComponents(BButton).at(1).trigger('click');
        moxios.wait(async () => {
          const request = moxios.requests.mostRecent();
          await request.respondWith({
            status: 200,
            response: {
              connection_ok: true,
              salt_ok: false
            }
          });

          await view.vm.$nextTick();
          expect(view.findAllComponents(BFormInput).at(5).element.value).toBe('settings.servers.offline');
          expect(view.findAllComponents(BFormText).length).toBe(3);
          expect(view.findAllComponents(BFormText).at(2).html()).toContain('settings.servers.offlineReason.salt');

          // check for valid connection
          await view.findAllComponents(BButton).at(1).trigger('click');
          moxios.wait(async () => {
            const request = moxios.requests.mostRecent();
            await request.respondWith({
              status: 200,
              response: {
                connection_ok: true,
                salt_ok: true
              }
            });

            await view.vm.$nextTick();
            expect(view.findAllComponents(BFormInput).at(5).element.value).toBe('settings.servers.online');
            expect(view.findAllComponents(BFormText).length).toBe(2);

            // check for response errors
            await view.findAllComponents(BButton).at(1).trigger('click');
            moxios.wait(async () => {
              const request = moxios.requests.mostRecent();
              await request.respondWith({
                status: 500,
                response: {
                  message: 'Test'
                }
              });

              await view.vm.$nextTick();
              expect(view.findAllComponents(BFormInput).at(5).element.value).toBe('settings.servers.unknown');
              expect(view.findAllComponents(BFormText).length).toBe(2);

              sinon.assert.calledOnce(Base.error);
              Base.error.restore();
              view.destroy();
              done();
            });
          });
        });
      });
    });
  });

  it('show usage data only if viewOnly and server enabled', function (done) {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      expect(view.findComponent({ ref: 'currentUsage' }).exists()).toBe(false);
      await view.setProps({ viewOnly: true });
      expect(view.findComponent({ ref: 'currentUsage' }).exists()).toBe(true);
      await view.setProps({ viewOnly: false });

      const restoreServerResponse = overrideStub('/api/v1/servers/1', {
        status: 200,
        response: {
          data: {
            id: 1,
            name: 'Server 01',
            description: 'Testserver 01',
            base_url: 'https://localhost/bigbluebutton',
            salt: '123456789',
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

      moxios.wait(async () => {
        await view.vm.$nextTick();
        expect(view.findComponent({ ref: 'currentUsage' }).exists()).toBe(false);
        await view.setProps({ viewOnly: true });
        expect(view.findComponent({ ref: 'currentUsage' }).exists()).toBe(false);

        restoreServerResponse();
        done();
      });
    });
  });

  it('show panic button only if user has permission', function (done) {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: true,
        id: '1'
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      expect(view.findComponent({ ref: 'currentUsage' }).find('button').exists()).toBe(true);
      PermissionService.setCurrentUser({ permissions: ['servers.view', 'servers.create', 'settings.manage'] });
      await view.vm.$nextTick();
      expect(view.findComponent({ ref: 'currentUsage' }).find('button').exists()).toBe(false);
      done();
    });
  });

  it('panic button calls api and gets disabled while running', function (done) {
    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      success (param) {
        flashMessageSpy(param);
      }
    };

    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        flashMessage: flashMessage
      },
      propsData: {
        viewOnly: true,
        id: '1'
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      const button = view.findComponent({ ref: 'currentUsage' }).find('button');
      await button.trigger('click');

      expect(button.attributes('disabled')).toBe('disabled');

      // check success
      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.url).toBe('/api/v1/servers/1/panic');
        expect(request.config.method).toBe('get');
        await request.respondWith({
          status: 200,
          response: {
            total: 5,
            success: 3
          }
        });
        await view.vm.$nextTick();
        expect(view.findComponent({ ref: 'currentUsage' }).find('button').attributes('disabled')).toBeUndefined();

        sinon.assert.calledOnce(flashMessageSpy);
        sinon.assert.calledWith(flashMessageSpy, {
          title: 'settings.servers.panicFlash.title',
          message: 'settings.servers.panicFlash.message:{"total":5,"success":3}'
        });

        // check reload of server data
        moxios.wait(async () => {
          const request = moxios.requests.mostRecent();
          expect(request.config.url).toBe('/api/v1/servers/1');
          expect(request.config.method).toBe('get');
          await view.vm.$nextTick();
          await button.trigger('click');

          // check error handling
          moxios.wait(async () => {
            const request = moxios.requests.mostRecent();
            expect(request.config.url).toBe('/api/v1/servers/1/panic');
            expect(request.config.method).toBe('get');
            await request.respondWith({
              status: 500,
              response: {
                message: 'Test'
              }
            });

            await view.vm.$nextTick();
            expect(view.findComponent({ ref: 'currentUsage' }).find('button').attributes('disabled')).toBeUndefined();
            sinon.assert.calledOnce(Base.error);
            Base.error.restore();
            done();
          });
        });
      });
    });
  });
});
