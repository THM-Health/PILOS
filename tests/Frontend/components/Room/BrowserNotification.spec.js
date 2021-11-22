import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BButton, IconsPlugin } from 'bootstrap-vue';
import moxios from 'moxios';
import BrowserNotification from '../../../../resources/js/components/Room/BrowserNotification';
import sinon from 'sinon';
import VueRouter from 'vue-router';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);
localVue.use(VueRouter);
localVue.use(Vuex);

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

describe('Browser Notification', function () {
  beforeEach(function () {
    moxios.install();
  });

  afterEach(function () {
    moxios.uninstall();
  });

  it('show enable button if permission is granted', function (done) {
    const NotificationFake = class {
      static permission = 'granted';
    };

    window.Notification = global.Notification = NotificationFake;

    const view = mount(BrowserNotification, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        running: false,
        name: 'test'
      },
      attachTo: createContainer()
    });

    view.vm.$nextTick().then(async () => {
      expect(view.findComponent(BButton).exists()).toBeTruthy();
      view.destroy();
      delete window.Notification;
      delete global.Notification;
      done();
    });
  });
  it('show enable button if permission is denied', function (done) {
    const NotificationFake = class {
      static permission = 'denied';
    };

    window.Notification = global.Notification = NotificationFake;

    const view = mount(BrowserNotification, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        running: false,
        name: 'test'
      },
      attachTo: createContainer()
    });

    view.vm.$nextTick().then(async () => {
      expect(view.findComponent(BButton).exists()).toBeTruthy();
      view.destroy();
      delete window.Notification;
      delete global.Notification;
      done();
    });
  });
  it('show enable button if permission is missing', function (done) {
    const constructorSpy = sinon.spy();
    const closeSpy = sinon.spy();

    const NotificationFake = class {
      constructor () {
        constructorSpy();
      }

      close () {
        closeSpy();
      }

      static permission = 'default';
    };

    window.Notification = global.Notification = NotificationFake;

    const view = mount(BrowserNotification, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        running: false,
        name: 'test'
      },
      attachTo: createContainer()
    });

    view.vm.$nextTick().then(async () => {
      expect(view.findComponent(BButton).exists()).toBeTruthy();
      sinon.assert.calledOnce(constructorSpy);
      sinon.assert.calledOnce(closeSpy);
      view.destroy();
      delete window.Notification;
      delete global.Notification;
      done();
    });
  });
  it('hide enable button if not supported by browser', function (done) {
    const view = mount(BrowserNotification, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        running: false,
        name: 'test'
      },
      attachTo: createContainer()
    });

    view.vm.$nextTick().then(async () => {
      expect(view.findComponent(BButton).exists()).toBeFalsy();
      view.destroy();
      done();
    });
  });
  it('show enable button if not fully supported', function (done) {
    const NotificationFake = class {
      constructor () {
        throw new TypeError('test');
      }

      static permission = 'default';
    };

    window.Notification = global.Notification = NotificationFake;

    const view = mount(BrowserNotification, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        running: false,
        name: 'test'
      },
      attachTo: createContainer()
    });

    view.vm.$nextTick().then(async () => {
      expect(view.findComponent(BButton).exists()).toBeFalsy();
      view.destroy();
      delete window.Notification;
      delete global.Notification;
      done();
    });
  });
});
