import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BAlert, BButton } from 'bootstrap-vue';
import moxios from 'moxios';
import BrowserNotification from '../../../../resources/js/components/Room/BrowserNotification';
import sinon from 'sinon';
import VueRouter from 'vue-router';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(VueRouter);
localVue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      getters: {
        settings: () => (setting) => setting === 'favicon' ? 'favicon.ico' : null
      }
    }
  }
});

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

const i18nDateMock = (date, format) => {
  return new Date(date).toLocaleString('en-US', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
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

  it('enable notifications wih granted permission', function (done) {
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
      expect(view.findComponent(BAlert).exists()).toBeFalsy();
      await view.findComponent(BButton).trigger('click');
      expect(view.findComponent(BButton).exists()).toBeFalsy();
      expect(view.findComponent(BAlert).exists()).toBeTruthy();

      view.destroy();
      delete window.Notification;
      delete global.Notification;
      done();
    });
  });
  it('enable notifications wih denied permission', function (done) {
    const NotificationFake = class {
      static permission = 'denied';
    };

    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      error (param) {
        flashMessageSpy(param);
      }
    };

    window.Notification = global.Notification = NotificationFake;

    const view = mount(BrowserNotification, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      propsData: {
        running: false,
        name: 'test'
      },
      attachTo: createContainer()
    });

    view.vm.$nextTick().then(async () => {
      expect(view.findComponent(BButton).exists()).toBeTruthy();
      expect(view.findComponent(BAlert).exists()).toBeFalsy();
      await view.findComponent(BButton).trigger('click');
      expect(view.findComponent(BButton).exists()).toBeTruthy();
      expect(view.findComponent(BAlert).exists()).toBeFalsy();
      expect(flashMessageSpy.calledOnce).toBeTruthy();
      expect(flashMessageSpy.getCall(0).args[0]).toEqual('rooms.notification.denied');

      view.destroy();
      delete window.Notification;
      delete global.Notification;
      done();
    });
  });
  it('enable notifications wih default permission, but granted on request', function (done) {
    const constructorSpy = sinon.spy();

    const NotificationFake = class {
      constructor () {
        constructorSpy();
      }

      close () {
      }

      static permission = 'default';
      static requestPermission () {
        return new Promise(function (resolve, reject) {
          resolve('granted');
        });
      }
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
      sinon.assert.calledOnce(constructorSpy);
      expect(view.findComponent(BButton).exists()).toBeTruthy();
      expect(view.findComponent(BAlert).exists()).toBeFalsy();
      await view.findComponent(BButton).trigger('click');
      expect(view.findComponent(BButton).exists()).toBeFalsy();
      expect(view.findComponent(BAlert).exists()).toBeTruthy();

      view.destroy();
      delete window.Notification;
      delete global.Notification;
      done();
    });
  });
  it('enable notifications wih default permission, but denied on request', function (done) {
    const constructorSpy = sinon.spy();
    const NotificationFake = class {
      constructor () {
        constructorSpy();
      }

      close () {
      }

      static permission = 'default';
      static requestPermission () {
        return new Promise(function (resolve, reject) {
          resolve('denied');
        });
      }
    };

    window.Notification = global.Notification = NotificationFake;

    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      error (param) {
        flashMessageSpy(param);
      }
    };

    const view = mount(BrowserNotification, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      propsData: {
        running: false,
        name: 'test'
      },
      attachTo: createContainer()
    });

    view.vm.$nextTick().then(async () => {
      sinon.assert.calledOnce(constructorSpy);
      expect(view.findComponent(BButton).exists()).toBeTruthy();
      expect(view.findComponent(BAlert).exists()).toBeFalsy();
      await view.findComponent(BButton).trigger('click');
      expect(view.findComponent(BButton).exists()).toBeTruthy();
      expect(view.findComponent(BAlert).exists()).toBeFalsy();

      expect(flashMessageSpy.calledOnce).toBeTruthy();
      expect(flashMessageSpy.getCall(0).args[0]).toEqual('rooms.notification.denied');

      view.destroy();
      delete window.Notification;
      delete global.Notification;
      done();
    });
  });

  it('change status from not running to running', function (done) {
    const constructorSpy = sinon.spy();
    const closeSpy = sinon.spy();
    const focusSpy = sinon.spy();
    const clock = sinon.useFakeTimers({ now: 1483228800000 });

    const NotificationFake = class {
      constructor (title, options = {}) {
        constructorSpy(title, options);
      }

      close () {
        closeSpy();
      }

      addEventListener (event, fnc) {
        this.clickFunction = fnc;
      }

      triggerClick () {
        this.clickFunction();
      }

      static permission = 'granted';
    };

    window.Notification = global.Notification = NotificationFake;
    window.focus = focusSpy;

    const view = mount(BrowserNotification, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock
      },
      propsData: {
        running: false,
        name: 'test'
      },
      attachTo: createContainer(),
      store
    });

    view.vm.$nextTick().then(async () => {
      await view.findComponent(BButton).trigger('click');
      await view.setProps({ running: true });

      sinon.assert.calledOnce(constructorSpy);
      expect(constructorSpy.getCall(0).args[0]).toEqual('test');
      expect(constructorSpy.getCall(0).args[1]).toEqual({ body: 'rooms.notification.body:{"time":"01/01/2017, 01:00"}', icon: 'favicon.ico' });

      await view.setProps({ running: false });
      sinon.assert.calledOnce(closeSpy);

      await view.setProps({ running: true });
      sinon.assert.calledTwice(constructorSpy);

      view.vm.$data.notification.triggerClick();
      sinon.assert.calledTwice(closeSpy);
      sinon.assert.calledOnce(focusSpy);

      view.destroy();
      delete window.Notification;
      delete global.Notification;
      delete window.focus;
      clock.restore();
      done();
    });
  });
  it('change status from not running to running with error', function (done) {
    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      error (param) {
        flashMessageSpy(param);
      }
    };

    const NotificationFake = class {
      constructor (title, options = {}) {
        throw new TypeError('test');
      }

      static permission = 'granted';
    };

    window.Notification = global.Notification = NotificationFake;

    const view = mount(BrowserNotification, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock,
        flashMessage: flashMessage
      },
      propsData: {
        running: false,
        name: 'test'
      },
      attachTo: createContainer(),
      store
    });

    view.vm.$nextTick().then(async () => {
      await view.findComponent(BButton).trigger('click');
      await view.setProps({ running: true });

      expect(view.findComponent(BButton).exists()).toBeFalsy();

      sinon.assert.calledOnce(flashMessageSpy);
      expect(flashMessageSpy.getCall(0).args[0]).toEqual('rooms.notification.browserSupport');

      view.destroy();
      delete window.Notification;
      delete global.Notification;
      done();
    });
  });
});
