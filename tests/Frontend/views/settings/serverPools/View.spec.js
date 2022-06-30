import View from '../../../../../resources/js/views/settings/serverPools/View';
import { createLocalVue, mount } from '@vue/test-utils';
import PermissionService from '../../../../../resources/js/services/PermissionService';
import Multiselect from 'vue-multiselect';
import moxios from 'moxios';
import BootstrapVue, {

  BFormInput,
  BOverlay,
  BButton, BForm, BFormInvalidFeedback, BModal
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

describe('ServerPoolView', () => {
  beforeEach(() => {
    oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser({ permissions: ['server.viewAny', 'serverPools.viewAny', 'serverPools.view', 'serverPools.create', 'serverPools.update', 'settings.manage'] });
    moxios.install();

    const serverResponse = {
      data: [
        {
          id: 1,
          name: 'Server 01',
          description: 'Testserver 01',
          strength: 1,
          status: 1,
          participant_count: 10,
          listener_count: 5,
          voice_participant_count: 5,
          video_count: 5,
          meeting_count: 2,
          own_meeting_count: 2,
          model_name: 'Server',
          updated_at: '2020-12-21T13:43:21.000000Z'
        },
        {
          id: 2,
          name: 'Server 02',
          description: 'Testserver 02',
          strength: 1,
          status: 1,
          participant_count: 50,
          listener_count: 25,
          voice_participant_count: 30,
          video_count: 5,
          meeting_count: 10,
          own_meeting_count: 9,
          model_name: 'Server',
          updated_at: '2020-12-21T13:43:21.000000Z'
        },
        {
          id: 3,
          name: 'Server 03',
          description: 'Testserver 03',
          strength: 1,
          status: -1,
          participant_count: null,
          listener_count: null,
          voice_participant_count: null,
          video_count: null,
          meeting_count: null,
          own_meeting_count: null,
          model_name: 'Server',
          updated_at: '2020-12-21T13:43:21.000000Z'
        }
      ],
      links: {
        first: 'http://localhost/api/v1/servers?page=1',
        last: 'http://localhost/api/v1/servers?page=2',
        prev: null,
        next: 'http://localhost/api/v1/servers?page=2'
      },
      meta: {
        current_page: 1,
        from: 1,
        last_page: 2,
        path: 'http://localhost/api/v1/servers',
        per_page: 3,
        to: 3,
        total: 4
      }
    };

    const serverPoolResponse = {
      data: {
        id: 1,
        name: 'Test',
        description: 'Pool for testing',
        server_count: 2,
        servers: [
          {
            id: 1,
            name: 'Server 01',
            description: 'Testserver 01',
            strength: 1,
            status: 1,
            participant_count: 10,
            listener_count: 5,
            voice_participant_count: 5,
            video_count: 5,
            meeting_count: 2,
            own_meeting_count: 2,
            model_name: 'Server',
            updated_at: '2020-12-21T13:43:21.000000Z'
          }
        ],
        model_name: 'ServerPool',
        updated_at: '2020-12-21T13:43:21.000000Z'
      }
    };

    moxios.stubRequest('/api/v1/servers?page=1', {
      status: 200,
      response: serverResponse
    });

    moxios.stubRequest('/api/v1/serverPools/1', {
      status: 200,
      response: serverPoolResponse
    });
  });

  afterEach(() => {
    PermissionService.setCurrentUser(oldUser);
    moxios.uninstall();
  });

  it(
    'input fields are disabled if the server pool is displayed in view mode',
    done => {
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
        expect(view.findAllComponents(Multiselect).wrappers.every(input => input.vm.disabled)).toBe(true);
        done();
      });
    }
  );

  it(
    'error handler gets called if an error occurs during load of data and reload button reloads data',
    done => {
      const spy = sinon.spy();
      sinon.stub(Base, 'error').callsFake(spy);

      const restoreServerPoolResponse = overrideStub('/api/v1/serverPools/1', {
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
        restoreServerPoolResponse();

        const reloadButton = view.findComponent({ ref: 'reloadServerPool' });
        expect(reloadButton.exists()).toBeTruthy();
        reloadButton.trigger('click');

        moxios.wait(function () {
          expect(view.vm.isBusy).toBe(false);
          expect(view.findComponent(BOverlay).props('show')).toBe(false);

          expect(view.vm.$data.model.id).toBe(1);
          expect(view.vm.$data.model.name).toEqual('Test');

          done();
        });
      });
    }
  );

  it(
    'error handler gets called and redirected if a 404 error occurs during load of data',
    done => {
      const routerSpy = sinon.spy();
      const router = new VueRouter();
      router.push = routerSpy;

      const spy = sinon.spy();
      sinon.stub(Base, 'error').callsFake(spy);

      const restoreServerPoolResponse = overrideStub('/api/v1/serverPools/1', {
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
        sinon.assert.calledWith(routerSpy, { name: 'settings.server_pools' });
        Base.error.restore();
        restoreServerPoolResponse();

        done();
      });
    }
  );

  it(
    'error handler gets called and redirected if a 404 error occurs during save of data',
    done => {
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
        const restoreServerPoolResponse = overrideStub('/api/v1/serverPools/1', {
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
          sinon.assert.calledWith(routerSpy, { name: 'settings.server_pools' });
          restoreServerPoolResponse();
          done();
        });
      });
    }
  );

  it(
    'error handler gets called if an error occurs during update',
    done => {
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
        const restoreServerPoolResponse = overrideStub('/api/v1/serverPools/1', {
          status: 500,
          response: {
            message: 'Test'
          }
        });

        view.findComponent(BForm).trigger('submit');

        moxios.wait(function () {
          sinon.assert.calledOnce(Base.error);
          Base.error.restore();
          restoreServerPoolResponse();
          done();
        });
      });
    }
  );

  it(
    'back button causes a back navigation without persistence',
    done => {
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
    }
  );

  it(
    'request with updates get send during saving the server',
    done => {
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
        await view.findAllComponents(BFormInput).at(0).setValue('Demo');
        await view.findAllComponents(BFormInput).at(1).setValue('Demopool');
        await view.findComponent(Multiselect).findAll('li').at(1).find('span').trigger('click');

        view.findComponent(BForm).trigger('submit');

        let restoreServerPoolResponse = overrideStub('/api/v1/serverPools/1', {
          status: env.HTTP_UNPROCESSABLE_ENTITY,
          response: {
            message: 'The given data was invalid.',
            errors: {
              name: ['Test name'],
              description: ['Test description'],
              servers: ['Test server']
            }
          }
        });

        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          const data = JSON.parse(request.config.data);

          expect(data.name).toBe('Demo');
          expect(data.description).toBe('Demopool');
          expect(data.servers).toEqual([1, 2]);

          const feedback = view.findAllComponents(BFormInvalidFeedback).wrappers;
          expect(feedback[0].html()).toContain('Test name');
          expect(feedback[1].html()).toContain('Test description');
          expect(feedback[2].html()).toContain('Test server');

          restoreServerPoolResponse();
          restoreServerPoolResponse = overrideStub('/api/v1/serverPools/1', {
            status: 204
          });

          view.findComponent(BForm).trigger('submit');

          moxios.wait(function () {
            sinon.assert.calledOnce(spy);
            restoreServerPoolResponse();
            done();
          });
        });
      });
    }
  );

  it(
    'modal gets shown for stale errors and a overwrite can be forced',
    done => {
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

        let restoreServerPoolResponse = overrideStub('/api/v1/serverPools/1', {
          status: env.HTTP_STALE_MODEL,
          response: {
            error: env.HTTP_STALE_MODEL,
            message: 'test',
            new_model: newModel
          }
        });

        view.findComponent(BForm).trigger('submit');

        moxios.wait(function () {
          const staleModelModal = view.findComponent({ ref: 'stale-server-pool-modal' });
          expect(staleModelModal.vm.$data.isVisible).toBe(true);

          restoreServerPoolResponse();
          restoreServerPoolResponse = overrideStub('/api/v1/serverPools/1', {
            status: 204
          });

          staleModelModal.vm.$refs['ok-button'].click();

          moxios.wait(function () {
            const request = moxios.requests.mostRecent();
            const data = JSON.parse(request.config.data);

            expect(data.updated_at).toBe(newModel.updated_at);
            expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
            restoreServerPoolResponse();
            done();
          });
        });
      });
    }
  );

  it(
    'modal gets shown for stale errors and the new model can be applied to current form',
    done => {
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
        newModel.name = 'Demo';

        const restoreServerPoolResponse = overrideStub('/api/v1/serverPools/1', {
          status: env.HTTP_STALE_MODEL,
          response: {
            error: env.HTTP_STALE_MODEL,
            message: 'test',
            new_model: newModel
          }
        });

        view.findComponent(BForm).trigger('submit');

        moxios.wait(function () {
          const staleModelModal = view.findComponent({ ref: 'stale-server-pool-modal' });
          expect(staleModelModal.vm.$data.isVisible).toBe(true);
          expect(view.findAllComponents(BFormInput).at(0).element.value).toBe('Test');

          restoreServerPoolResponse();

          staleModelModal.vm.$refs['cancel-button'].click();

          view.vm.$nextTick().then(() => {
            expect(view.findAllComponents(BFormInput).at(0).element.value).toBe('Demo');
            expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
            done();
          });
        });
      });
    }
  );

  it('server get loaded, pagination and error handling', done => {
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
      store
    });

    const multiSelect = view.findComponent(Multiselect);

    const saveButton = view.findAllComponents(BButton).at(3);
    expect(saveButton.html()).toContain('app.save');

    // load servers
    moxios.wait(async function () {
      const request = moxios.requests.mostRecent();
      expect(request.url).toBe('/api/v1/servers?page=1');
      await view.vm.$nextTick();

      // check drop down values
      expect(multiSelect.find('ul').findAll('li').at(0).text()).toContain('Server 01');
      expect(multiSelect.find('ul').findAll('li').at(1).text()).toContain('Server 02');
      expect(multiSelect.find('ul').findAll('li').at(2).text()).toContain('Server 03');

      // check pagination
      const paginationButtons = multiSelect.findAllComponents(BButton);
      expect(paginationButtons.at(0).attributes('disabled')).toBe('disabled');
      expect(paginationButtons.at(1).attributes('disabled')).toBeUndefined();

      // test navigate to next page
      await paginationButtons.at(1).trigger('click');
      // dropdown show loading spinner during load and save disabled
      expect(multiSelect.props('loading')).toBeTruthy();
      moxios.wait(async function () {
        const request = moxios.requests.mostRecent();
        expect(request.url).toBe('/api/v1/servers?page=2');
        await request.respondWith({
          status: 200,
          response: {
            data: [
              {
                id: 4,
                name: 'Server 04',
                description: 'Testserver 04',
                strength: 1,
                status: -1,
                participant_count: null,
                listener_count: null,
                voice_participant_count: null,
                video_count: null,
                meeting_count: null,
                own_meeting_count: null,
                model_name: 'Server',
                updated_at: '2020-12-21T13:43:21.000000Z'
              }
            ],
            meta: {
              current_page: 2,
              from: 4,
              last_page: 2,
              per_page: 3,
              to: 4,
              total: 4
            }
          }
        });
        await view.vm.$nextTick();

        // hide loading spinner and active save button
        expect(multiSelect.props('loading')).toBeFalsy();
        expect(saveButton.attributes('disabled')).toBeUndefined();

        expect(paginationButtons.at(0).attributes('disabled')).toBeUndefined();
        expect(paginationButtons.at(1).attributes('disabled')).toBe('disabled');

        // test error during load
        const restoreServerPoolResponse = overrideStub('/api/v1/servers?page=1', {
          status: 500,
          response: {
            message: 'Test'
          }
        });
        await paginationButtons.at(0).trigger('click');
        moxios.wait(async function () {
          await view.vm.$nextTick();

          // hide loading spinner, disable dropdown and prevent saving
          expect(multiSelect.props('loading')).toBeFalsy();
          expect(multiSelect.props('disabled')).toBeTruthy();
          expect(saveButton.attributes('disabled')).toBe('disabled');

          sinon.assert.calledOnce(Base.error);
          Base.error.restore();
          restoreServerPoolResponse();

          const reloadButton = view.findAllComponents(BButton).at(2);
          expect(reloadButton.html()).toContain('fa-solid fa-sync');

          await reloadButton.trigger('click');

          // load servers
          moxios.wait(async function () {
            expect(saveButton.attributes('disabled')).toBe('disabled');
            const request = moxios.requests.mostRecent();
            expect(request.url).toBe('/api/v1/servers?page=2');
            await request.respondWith({
              status: 200,
              response: {
                data: [
                  {
                    id: 4,
                    name: 'Server 04',
                    description: 'Testserver 04',
                    strength: 1,
                    status: -1,
                    participant_count: null,
                    listener_count: null,
                    voice_participant_count: null,
                    video_count: null,
                    meeting_count: null,
                    own_meeting_count: null,
                    model_name: 'Server',
                    updated_at: '2020-12-21T13:43:21.000000Z'
                  }
                ],
                meta: {
                  current_page: 2,
                  from: 4,
                  last_page: 2,
                  per_page: 3,
                  to: 4,
                  total: 4
                }
              }
            });
            await view.vm.$nextTick();

            // hide loading spinner, enable dropdown and enable saving
            expect(multiSelect.props('loading')).toBeFalsy();
            expect(multiSelect.props('disabled')).toBeFalsy();
            expect(saveButton.attributes('disabled')).toBeUndefined();

            done();
          });
        });
      });
    });
  });
});
