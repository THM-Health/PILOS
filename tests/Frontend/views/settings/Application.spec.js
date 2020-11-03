import { createLocalVue, mount } from '@vue/test-utils';
import moxios from 'moxios';
import BootstrapVue, { IconsPlugin } from 'bootstrap-vue';
import sinon from 'sinon';
import Base from '../../../../resources/js/api/base';
import Application from '../../../../resources/js/views/settings/Application';
import Vuex from 'vuex';
import env from '../../../../resources/js/env.js';

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
        expect(view.vm.$data.roomLimitMode).toBe('unlimited');
        done();
      });
    });
  });

  it('roomLimitModeChanged method works properly', async function () {
    const view = mount(Application, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    // Room limit radio group value set to 'custom' by default
    const roomLimitRadioGroup = view.find('#application-room-limit-radio-group');
    expect(roomLimitRadioGroup.exists()).toBeTruthy();
    expect(roomLimitRadioGroup.props('checked')).toBe('custom');

    // Simulate radio group check to 'unlimited' option, set room limit value to '-1' and hide roomLimitInput
    await view.vm.roomLimitModeChanged('unlimited');

    expect(view.vm.$data.settings.roomLimit).toBe(-1);

    // Simulate radio group check back to 'custom' option
    await view.vm.roomLimitModeChanged('custom');

    expect(view.vm.$data.settings.roomLimit).toBe(0);
  });

  it('updateSettings method works properly', function (done) {
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

  it('getSettings error handler', function (done) {
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

  it('updateSettings error handler', function (done) {
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

  it('updateSettings error handler code 413', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const view = mount(Application, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    // Errors data 'logo_file' array is undefined at the beginning
    expect(view.vm.$data.errors.logo_file).toBeUndefined();

    // Save button, which triggers updateSettings method when clicked
    const saveSettingsButton = view.find('#application-save-button');
    expect(saveSettingsButton.exists()).toBeTruthy();
    saveSettingsButton.trigger('click');
    view.vm.$nextTick();

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: env.HTTP_PAYLOAD_TOO_LARGE,
        response: {
          message: 'Test'
        }
      }).then(() => {
        view.vm.$nextTick();

        // Errors data 'logo_file' array is populated for this error code
        expect(view.vm.$data.errors.logo_file.length).toBeGreaterThan(0);

        Base.error.restore();
        done();
      });
    });
  });

  it('updateSettings error handler code 422', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const view = mount(Application, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    // Errors data logo file array is undefined at the beginning
    expect(view.vm.$data.errors.pagination_page_size).toBeUndefined();

    // Save button, which triggers updateSettings method when clicked
    const saveSettingsButton = view.find('#application-save-button');
    expect(saveSettingsButton.exists()).toBeTruthy();
    saveSettingsButton.trigger('click');
    view.vm.$nextTick();

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: env.HTTP_UNPROCESSABLE_ENTITY,
        response: {
          errors: {
            logo: ['logo error'],
            room_limit: ['room limit error'],
            pagination_page_size: ['pagination page size error.'],
            own_rooms_pagination_page_size: ['own rooms pagination page size error']
          }
        }
      }).then(() => {
        view.vm.$nextTick();

        // Errors data populated accordingly to error response for this code
        expect(view.vm.$data.errors.logo.length).toBeGreaterThan(0);
        expect(view.vm.$data.errors.room_limit.length).toBeGreaterThan(0);
        expect(view.vm.$data.errors.pagination_page_size.length).toBeGreaterThan(0);
        expect(view.vm.$data.errors.own_rooms_pagination_page_size.length).toBeGreaterThan(0);

        Base.error.restore();
        done();
      });
    });
  });

  it('uploadLogoFile watcher called base64Encode method when value of data props uploadLogoFile changed', async function () {
    const view = mount(Application, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    // base64Encode method spy
    const spy = sinon.spy(view.vm, 'base64Encode');

    expect(spy.calledOnce).toBeFalsy();

    expect(view.vm.$data.uploadLogoFile).toBe(null);
    expect(view.vm.$data.uploadLogoFileSrc).toBe(null);

    // Trigger watcher by setting to data props uploadLogoFile, empty array to avoid test warn
    await view.setData({ uploadLogoFile: [] });

    // baseEncode64 method should be called after value change of uploadLogoFileSrc
    expect(spy.calledOnce).toBeTruthy();
  });
});
