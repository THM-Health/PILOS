import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BAlert, BButton } from 'bootstrap-vue';
import moxios from 'moxios';
import BrowserNotification from '../../../../resources/js/components/Room/BrowserNotification';
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

describe('Browser Notification', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('show enable button if permission is granted', async () => {
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

    await view.vm.$nextTick();
    expect(view.findComponent(BButton).exists()).toBeTruthy();
    view.destroy();
    delete window.Notification;
    delete global.Notification;
  });

  it('show enable button if permission is denied', async () => {
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

    await view.vm.$nextTick();

    expect(view.findComponent(BButton).exists()).toBeTruthy();
    view.destroy();
    delete window.Notification;
    delete global.Notification;
  });

  it('show enable button if permission is missing', async () => {
    const constructorSpy = jest.fn();
    const closeSpy = jest.fn();

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

    expect(constructorSpy).toBeCalledTimes(0);
    expect(closeSpy).toBeCalledTimes(0);

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

    await view.vm.$nextTick();

    expect(view.findComponent(BButton).exists()).toBeTruthy();
    expect(constructorSpy).toBeCalledTimes(1);
    expect(closeSpy).toBeCalledTimes(1);
    view.destroy();
    delete window.Notification;
    delete global.Notification;
  });

  it('hide enable button if not supported by browser', async () => {
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

    await view.vm.$nextTick();
    expect(view.findComponent(BButton).exists()).toBeFalsy();
    view.destroy();
  });
  it('show enable button if not fully supported', async () => {
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

    await view.vm.$nextTick();
    expect(view.findComponent(BButton).exists()).toBeFalsy();
    view.destroy();
    delete window.Notification;
    delete global.Notification;
  });

  it('enable notifications wih granted permission', async () => {
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

    await view.vm.$nextTick();

    expect(view.findComponent(BButton).exists()).toBeTruthy();
    expect(view.findComponent(BAlert).exists()).toBeFalsy();
    await view.findComponent(BButton).trigger('click');
    expect(view.findComponent(BButton).exists()).toBeFalsy();
    expect(view.findComponent(BAlert).exists()).toBeTruthy();

    view.destroy();
    delete window.Notification;
    delete global.Notification;
  });
  it('enable notifications wih denied permission', async () => {
    const NotificationFake = class {
      static permission = 'denied';
    };

    const flashMessageSpy = jest.fn();
    const flashMessage = { error: flashMessageSpy };

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

    await view.vm.$nextTick();
    expect(view.findComponent(BButton).exists()).toBeTruthy();
    expect(view.findComponent(BAlert).exists()).toBeFalsy();
    await view.findComponent(BButton).trigger('click');
    expect(view.findComponent(BButton).exists()).toBeTruthy();
    expect(view.findComponent(BAlert).exists()).toBeFalsy();
    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy.mock.calls[0][0]).toEqual('rooms.notification.denied');

    view.destroy();
    delete window.Notification;
    delete global.Notification;
  });
  it('enable notifications wih default permission, but granted on request', async () => {
    const constructorSpy = jest.fn();

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

    await view.vm.$nextTick();
    expect(constructorSpy).toBeCalledTimes(1);
    expect(view.findComponent(BButton).exists()).toBeTruthy();
    expect(view.findComponent(BAlert).exists()).toBeFalsy();
    await view.findComponent(BButton).trigger('click');
    expect(view.findComponent(BButton).exists()).toBeFalsy();
    expect(view.findComponent(BAlert).exists()).toBeTruthy();

    view.destroy();
    delete window.Notification;
    delete global.Notification;
  }
  );
  it('enable notifications wih default permission, but denied on request', async () => {
    const constructorSpy = jest.fn();
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

    const flashMessageSpy = jest.fn();
    const flashMessage = { error: flashMessageSpy };

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

    await view.vm.$nextTick();
    expect(constructorSpy).toBeCalledTimes(1);

    expect(view.findComponent(BButton).exists()).toBeTruthy();
    expect(view.findComponent(BAlert).exists()).toBeFalsy();
    await view.findComponent(BButton).trigger('click');
    expect(view.findComponent(BButton).exists()).toBeTruthy();
    expect(view.findComponent(BAlert).exists()).toBeFalsy();

    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy.mock.calls[0][0]).toEqual('rooms.notification.denied');

    view.destroy();
    delete window.Notification;
    delete global.Notification;
  });

  it('change status from not running to running', async () => {
    const constructorSpy = jest.fn();
    const closeSpy = jest.fn();
    const focusSpy = jest.fn();
    jest.useFakeTimers().setSystemTime(new Date('2017-01-01'));

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

    await view.vm.$nextTick();
    await view.findComponent(BButton).trigger('click');
    await view.setProps({ running: true });

    expect(constructorSpy).toBeCalledTimes(1);
    expect(constructorSpy.mock.calls[0][0]).toEqual('test');
    expect(constructorSpy.mock.calls[0][1]).toEqual({ body: 'rooms.notification.body:{"time":"01/01/2017, 01:00"}', icon: 'favicon.ico' });

    await view.setProps({ running: false });
    expect(closeSpy).toBeCalledTimes(1);

    await view.setProps({ running: true });
    expect(constructorSpy).toBeCalledTimes(2);

    view.vm.$data.notification.triggerClick();
    expect(closeSpy).toBeCalledTimes(2);
    expect(focusSpy).toBeCalledTimes(1);

    view.destroy();
    delete window.Notification;
    delete global.Notification;
    delete window.focus;

    jest.useRealTimers();
  });
  it('change status from not running to running with error', async () => {
    const flashMessageSpy = jest.fn();
    const flashMessage = { error: flashMessageSpy };

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

    await view.vm.$nextTick();
    await view.findComponent(BButton).trigger('click');
    await view.setProps({ running: true });

    expect(view.findComponent(BButton).exists()).toBeFalsy();

    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy.mock.calls[0][0]).toEqual('rooms.notification.browserSupport');

    view.destroy();
    delete window.Notification;
    delete global.Notification;
  });
});
