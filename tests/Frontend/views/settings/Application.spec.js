import { createLocalVue, mount } from '@vue/test-utils';
import moxios from 'moxios';
import BootstrapVue, { IconsPlugin } from 'bootstrap-vue';
import sinon from 'sinon';
import Base from '../../../../resources/js/api/base';
import Application from '../../../../resources/js/views/settings/Application';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);
localVue.use(Vuex);

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

describe('Application', function () {
  beforeEach(function () {
    moxios.install();
  });

  afterEach(function () {
    moxios.uninstall();
  });

  it('getSettings method called, when the view is mounted', function () {
    const spy = sinon.spy(Application.methods, 'getSettings');

    expect(spy.calledOnce).toBeFalsy();

    mount(Application, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    expect(spy.calledOnce).toBeTruthy();
  });

  it('getSettings method works properly', function (done) {
    const view = mount(Application, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          data: {
            logo: 'test.svg',
            room_limit: -1,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5
          }
        }
      }).then(() => {
        view.vm.$nextTick();
        expect(view.vm.$data.settings.logo).toBe('test.svg');
        expect(view.vm.$data.settings.roomLimit).toBe(-1);
        expect(view.vm.$data.settings.paginationPageSize).toBe(10);
        expect(view.vm.$data.settings.ownRoomsPaginationPageSize).toBe(5);
        done();
      });
    });
  });

  it('updateSettings method works properly', function (done) {
    const flashMessageSpySuccess = sinon.spy();
    const flashMessage = {
      success (param) {
        flashMessageSpySuccess(param);
      }
    };

    const actions = {
      getSettings () {
      }
    };

    const store = new Vuex.Store({
      modules:
        {
          session: { actions, namespaced: true }
        }
    });

    const view = mount(Application, {
      localVue,
      store,
      mocks: {
        $t: key => key,
        flashMessage: flashMessage
      },
      attachTo: createContainer()
    });

    // Save button, which triggers updateSettings method when clicked
    const saveSettingsButton = view.find('#application-save-button');
    expect(saveSettingsButton.exists()).toBeTruthy();
    saveSettingsButton.trigger('click');
    view.vm.$nextTick();

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 201,
        response: {
          data: {
            logo: 'test.svg',
            room_limit: -1,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5
          }
        }
      }).then(() => {
        view.vm.$nextTick();
        expect(view.vm.$data.settings.logo).toBe('test.svg');
        expect(view.vm.$data.settings.roomLimit).toBe(-1);
        expect(view.vm.$data.settings.paginationPageSize).toBe(10);
        expect(view.vm.$data.settings.ownRoomsPaginationPageSize).toBe(5);
        expect(view.vm.$data.isBusy).toBeFalsy();
        done();
      });
    });
  });

  it('getSettings error handler called when errors occur', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const view = mount(Application, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 500,
        response: {
          message: 'Test'
        }
      }).then(() => {
        view.vm.$nextTick();
        sinon.assert.calledOnce(Base.error);
        Base.error.restore();
        done();
      });
    });
  });

  it('updateSettings error handler called when errors occur', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const view = mount(Application, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    // Save button, which triggers updateSettings method when clicked
    const saveSettingsButton = view.find('#application-save-button');
    expect(saveSettingsButton.exists()).toBeTruthy();
    saveSettingsButton.trigger('click');
    view.vm.$nextTick();

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 500,
        response: {
          message: 'Test'
        }
      }).then(() => {
        view.vm.$nextTick();
        sinon.assert.calledOnce(Base.error);
        Base.error.restore();
        done();
      });
    });
  });
});
