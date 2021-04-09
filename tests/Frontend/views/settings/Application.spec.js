import { createLocalVue, mount } from '@vue/test-utils';
import moxios from 'moxios';
import BootstrapVue, { BFormCheckbox, BFormInput, BFormTextarea, IconsPlugin } from 'bootstrap-vue';
import sinon from 'sinon';
import Base from '../../../../resources/js/api/base';
import Application from '../../../../resources/js/views/settings/Application';
import Vuex from 'vuex';
import env from '../../../../resources/js/env.js';
import PermissionService from '../../../../resources/js/services/PermissionService';
import VSwatches from 'vue-swatches';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);
localVue.use(Vuex);

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

const bbbSettings = {
  file_mimes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png',
  max_filesize: 30
};

describe('Application', function () {
  beforeEach(function () {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'applicationSettings.update', 'settings.manage'] });
    moxios.install();
    moxios.stubRequest('/api/v1/getTimezones', {
      status: 200,
      response: {
        timezones: ['UTC']
      }
    });
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

  it('getSettings method works properly with response data room_limit is -1', function (done) {
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
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings
          }
        }
      }).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        expect(view.vm.$data.settings.logo).toBe('test.svg');
        expect(view.vm.$data.settings.room_limit).toBe(-1);
        expect(view.vm.$data.settings.pagination_page_size).toBe(10);
        expect(view.vm.$data.settings.own_rooms_pagination_page_size).toBe(5);
        expect(view.vm.$data.roomLimitMode).toBe('unlimited');
        done();
      });
    });
  });

  it('getSettings method works properly with response data room_limit is not -1', function (done) {
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
            room_limit: 32,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings
          }
        }
      }).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        expect(view.vm.$data.settings.logo).toBe('test.svg');
        expect(view.vm.$data.settings.room_limit).toBe(32);
        expect(view.vm.$data.settings.pagination_page_size).toBe(10);
        expect(view.vm.$data.settings.own_rooms_pagination_page_size).toBe(5);
        expect(view.vm.$data.roomLimitMode).toBe('custom');
        done();
      });
    });
  });

  it('updateSettings method works properly with response data room_limit is not -1', function (done) {
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

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          data: {
            logo: 'test.svg',
            room_limit: 32,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings
          }
        }
      }).then(() => {
        // Save button, which triggers updateSettings method when clicked
        const saveSettingsButton = view.find('#application-save-button');
        expect(saveSettingsButton.exists()).toBeTruthy();
        saveSettingsButton.trigger('click');
        return view.vm.$nextTick();
      }).then(() => {
        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          request.respondWith({
            status: 200,
            response: {
              data: {
                logo: 'test1.svg',
                room_limit: 33,
                pagination_page_size: 11,
                own_rooms_pagination_page_size: 6,
                banner: {
                  enabled: false
                },
                bbb: bbbSettings
              }
            }
          }).then(() => {
            return view.vm.$nextTick();
          }).then(() => {
            expect(view.vm.$data.settings.logo).toBe('test1.svg');
            expect(view.vm.$data.settings.room_limit).toBe(33);
            expect(view.vm.$data.settings.pagination_page_size).toBe(11);
            expect(view.vm.$data.settings.own_rooms_pagination_page_size).toBe(6);
            expect(view.vm.$data.roomLimitMode).toBe('custom');
            expect(view.vm.$data.isBusy).toBeFalsy();
            done();
          });
        });
      });
    });
  });

  it('updateSettings method works properly with response data room_limit is -1', function (done) {
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

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          data: {
            logo: 'test.svg',
            room_limit: 32,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings
          }
        }
      }).then(() => {
        // Save button, which triggers updateSettings method when clicked
        const saveSettingsButton = view.find('#application-save-button');
        expect(saveSettingsButton.exists()).toBeTruthy();
        saveSettingsButton.trigger('click');
        return view.vm.$nextTick();
      }).then(() => {
        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          request.respondWith({
            status: 200,
            response: {
              data: {
                logo: 'test1.svg',
                room_limit: -1,
                pagination_page_size: 11,
                own_rooms_pagination_page_size: 6,
                banner: {
                  enabled: false
                },
                bbb: bbbSettings
              }
            }
          }).then(() => {
            return view.vm.$nextTick();
          }).then(() => {
            expect(view.vm.$data.settings.logo).toBe('test1.svg');
            expect(view.vm.$data.settings.room_limit).toBe(-1);
            expect(view.vm.$data.settings.pagination_page_size).toBe(11);
            expect(view.vm.$data.settings.own_rooms_pagination_page_size).toBe(6);
            expect(view.vm.$data.roomLimitMode).toBe('unlimited');
            expect(view.vm.$data.isBusy).toBeFalsy();
            done();
          });
        });
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

    expect(view.vm.$data.settings.room_limit).toBe(-1);

    // Simulate radio group check back to 'custom' option
    await view.vm.roomLimitModeChanged('custom');

    expect(view.vm.$data.settings.room_limit).toBe(0);
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
        return view.vm.$nextTick();
      }).then(() => {
        sinon.assert.calledOnce(Base.error);
        Base.error.restore();
        done();
      });
    });
  });

  it('updateSettings sends null values and booleans correctly to the backend', function (done) {
    const store = new Vuex.Store({
      modules: {
        session: { actions: { getSettings () {} }, namespaced: true }
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

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          data: {
            logo: 'test.svg',
            room_limit: 32,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: true,
              message: 'Test',
              color: '#fff',
              background: '#000',
              icon: null,
              title: null,
              link: null
            },
            bbb: bbbSettings,
            help_url: null
          }
        }
      }).then(() => {
        const bannerFormGroup = view.findComponent({ ref: 'banner-form-group' });
        const bannerEnableBox = bannerFormGroup.findComponent(BFormCheckbox);
        expect(bannerEnableBox.props('checked')).toBe(true);
        return bannerEnableBox.get('input').trigger('click');
      }).then(() => {
        const bannerFormGroup = view.findComponent({ ref: 'banner-form-group' });
        const bannerEnableBox = bannerFormGroup.findComponent(BFormCheckbox);
        expect(bannerEnableBox.props('checked')).toBe(false);
        expect([
          ...bannerFormGroup.findAllComponents(BFormInput).wrappers,
          ...bannerFormGroup.findAllComponents(BFormTextarea).wrappers,
          ...bannerFormGroup.findAllComponents(VSwatches).wrappers
        ].every(input => input.props('disabled'))).toBe(true);
        expect(view.vm.settings.banner).toMatchObject({
          enabled: false,
          message: 'Test',
          color: '#fff',
          background: '#000',
          icon: null,
          title: null,
          link: null
        });

        const saveSettingsButton = view.find('#application-save-button');
        expect(saveSettingsButton.exists()).toBeTruthy();
        saveSettingsButton.trigger('click');

        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          expect(request.config.data.get('banner[enabled]')).toStrictEqual('0');
          expect(request.config.data.get('banner[message]')).toStrictEqual('Test');
          expect(request.config.data.get('banner[color]')).toStrictEqual('#fff');
          expect(request.config.data.get('banner[background]')).toStrictEqual('#000');
          expect(request.config.data.get('banner[title]')).toStrictEqual('');
          expect(request.config.data.get('banner[icon]')).toStrictEqual('');
          expect(request.config.data.get('banner[link]')).toStrictEqual('');
          expect(request.config.data.get('help_url')).toStrictEqual('');
          view.destroy();
          done();
        });
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

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          data: {
            logo: 'test.svg',
            room_limit: 32,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings
          }
        }
      }).then(() => {
        // Save button, which triggers updateSettings method when clicked
        const saveSettingsButton = view.find('#application-save-button');
        expect(saveSettingsButton.exists()).toBeTruthy();
        saveSettingsButton.trigger('click');
        return view.vm.$nextTick();
      }).then(() => {
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

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          data: {
            logo: 'test.svg',
            room_limit: 32,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings
          }
        }
      }).then(() => {
        // Errors data 'logo_file' array is undefined at the beginning
        expect(view.vm.$data.errors.logo_file).toBeUndefined();

        // Save button, which triggers updateSettings method when clicked
        const saveSettingsButton = view.find('#application-save-button');
        expect(saveSettingsButton.exists()).toBeTruthy();
        saveSettingsButton.trigger('click');
        return view.vm.$nextTick();
      }).then(() => {
        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          request.respondWith({
            status: env.HTTP_PAYLOAD_TOO_LARGE,
            response: {
              message: 'Test'
            }
          }).then(() => {
            return view.vm.$nextTick();
          }).then(() => {
            sinon.assert.calledOnce(Base.error);
            Base.error.restore();
            done();
          });
        });
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

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();

      request.respondWith({
        status: 200,
        response: {
          data: {
            logo: 'test.svg',
            room_limit: -1,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings
          }
        }
      }).then(() => {
        // Errors data logo file array is undefined at the beginning
        expect(view.vm.$data.errors.pagination_page_size).toBeUndefined();

        // Save button, which triggers updateSettings method when clicked
        const saveSettingsButton = view.find('#application-save-button');
        expect(saveSettingsButton.exists()).toBeTruthy();
        saveSettingsButton.trigger('click');

        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          request.respondWith({
            status: env.HTTP_UNPROCESSABLE_ENTITY,
            response: {
              errors: {
                logo: ['logo error'],
                room_limit: ['room limit error'],
                pagination_page_size: ['pagination page size error.'],
                own_rooms_pagination_page_size: ['own rooms pagination page size error'],
                help_url: ['help url error']
              }
            }
          }).then(() => {
            return view.vm.$nextTick();
          }).then(() => {
            // Errors data populated accordingly to error response for this code
            expect(view.vm.$data.errors.logo.length).toBeGreaterThan(0);
            expect(view.vm.$data.errors.room_limit.length).toBeGreaterThan(0);
            expect(view.vm.$data.errors.pagination_page_size.length).toBeGreaterThan(0);
            expect(view.vm.$data.errors.own_rooms_pagination_page_size.length).toBeGreaterThan(0);
            expect(view.vm.$data.errors.help_url.length).toBeGreaterThan(0);

            Base.error.restore();
            done();
          });
        });
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

    expect(view.vm.$data.uploadFaviconFile).toBe(null);
    expect(view.vm.$data.uploadFaviconFileSrc).toBe(null);

    await view.setData({ uploadFaviconFile: [] });

    expect(spy.calledTwice).toBeTruthy();
  });

  it('disable edit button if user does not have permission', function (done) {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'settings.manage'] });

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

    // Save button should be missing
    const saveSettingsButton = view.find('#application-save-button');
    expect(saveSettingsButton.exists()).toBeFalsy();
    done();
  });

  it('delete default presentation button is not visible if the view is in view only mode', function (done) {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'settings.manage'] });

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

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();

      request.respondWith({
        status: 200,
        response: {
          data: {
            logo: 'test.svg',
            room_limit: -1,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings,
            default_presentation: 'foo.pdf'
          }
        }
      }).then(() => {
        expect(view.findComponent({ ref: 'delete-default-presentation' }).exists()).toBe(false);
        view.destroy();
        done();
      });
    });
  });

  it('delete default presentation button is visible if the view is not in view only mode', function (done) {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'settings.manage', 'applicationSettings.update'] });

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

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();

      request.respondWith({
        status: 200,
        response: {
          data: {
            logo: 'test.svg',
            room_limit: -1,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings,
            default_presentation: 'foo.pdf'
          }
        }
      }).then(() => {
        expect(view.findComponent({ ref: 'delete-default-presentation' }).exists()).toBe(true);
        view.destroy();
        done();
      });
    });
  });

  it('delete default presentation button is not visible if there is no default presentation or a new presentation was uploaded', function (done) {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'settings.manage', 'applicationSettings.update'] });

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

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();

      request.respondWith({
        status: 200,
        response: {
          data: {
            logo: 'test.svg',
            room_limit: -1,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings
          }
        }
      }).then(() => {
        expect(view.findComponent({ ref: 'delete-default-presentation' }).exists()).toBe(false);
        // fake new upload
        view.setData({
          default_presentation: new window.File(['foo'], 'foo.txt', {
            type: 'text/plain',
            lastModified: Date.now()
          })
        });
        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent({ ref: 'delete-default-presentation' }).exists()).toBe(false);
        view.destroy();
        done();
      });
    });
  });

  it('revert default presentation button is not visible if the view is in view only mode', function (done) {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'settings.manage'] });

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

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();

      request.respondWith({
        status: 200,
        response: {
          data: {
            logo: 'test.svg',
            room_limit: -1,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings,
            default_presentation: 'foo.pdf'
          }
        }
      }).then(() => {
        expect(view.findComponent({ ref: 'reset-default-presentation' }).exists()).toBe(false);
        view.destroy();
        done();
      });
    });
  });

  it('revert default presentation button is not visible if there is no new default presentation', function (done) {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'applicationSettings.update', 'settings.manage'] });

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

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();

      request.respondWith({
        status: 200,
        response: {
          data: {
            logo: 'test.svg',
            room_limit: -1,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings,
            default_presentation: 'foo.pdf'
          }
        }
      }).then(() => {
        expect(view.findComponent({ ref: 'reset-default-presentation' }).exists()).toBe(false);
        // fake new upload
        view.setData({
          default_presentation: new window.File(['foo'], 'foo.txt', {
            type: 'text/plain',
            lastModified: Date.now()
          })
        });
        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent({ ref: 'reset-default-presentation' }).exists()).toBe(true);
        view.destroy();
        done();
      });
    });
  });

  it('view default presentation button is not visible if there is no default presentation even if a new was uploaded but not persisted', function (done) {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'settings.manage', 'applicationSettings.update'] });

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

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();

      request.respondWith({
        status: 200,
        response: {
          data: {
            logo: 'test.svg',
            room_limit: -1,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings
          }
        }
      }).then(() => {
        expect(view.findComponent({ ref: 'view-default-presentation' }).exists()).toBe(false);
        // fake new upload
        view.setData({
          default_presentation: new window.File(['foo'], 'foo.txt', {
            type: 'text/plain',
            lastModified: Date.now()
          })
        });
        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent({ ref: 'view-default-presentation' }).exists()).toBe(false);
        view.destroy();
        done();
      });
    });
  });

  it('if no new default presentation was uploaded the attribute does not get send with the request', function (done) {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'applicationSettings.update', 'settings.manage'] });

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

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();

      request.respondWith({
        status: 200,
        response: {
          data: {
            logo: 'test.svg',
            room_limit: -1,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings,
            default_presentation: 'foo.pdf'
          }
        }
      }).then(() => {
        const saveSettingsButton = view.find('#application-save-button');
        expect(saveSettingsButton.exists()).toBeTruthy();
        saveSettingsButton.trigger('click');
        return view.vm.$nextTick();
      }).then(() => {
        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          expect(request.config.data.has('default_presentation')).toBe(false);

          view.destroy();
          done();
        });
      });
    });
  });

  it('if the default presentation was deleted the attribute gets send as null value the request', function (done) {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'applicationSettings.update', 'settings.manage'] });

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

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();

      request.respondWith({
        status: 200,
        response: {
          data: {
            logo: 'test.svg',
            room_limit: -1,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings,
            default_presentation: 'foo.pdf'
          }
        }
      }).then(() => {
        view.findComponent({ ref: 'delete-default-presentation' }).trigger('click');

        const saveSettingsButton = view.find('#application-save-button');
        expect(saveSettingsButton.exists()).toBeTruthy();
        saveSettingsButton.trigger('click');
        return view.vm.$nextTick();
      }).then(() => {
        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          expect(request.config.data.get('default_presentation')).toBe('');

          view.destroy();
          done();
        });
      });
    });
  });

  it('if a new default presentation was uploaded the file gets send', function (done) {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'applicationSettings.update', 'settings.manage'] });

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

    const file = new window.File(['foo'], 'foo.txt', {
      type: 'text/plain',
      lastModified: Date.now()
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
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings,
            default_presentation: 'foo.pdf'
          }
        }
      }).then(() => {
        view.setData({
          default_presentation: file
        });

        const saveSettingsButton = view.find('#application-save-button');
        expect(saveSettingsButton.exists()).toBeTruthy();
        saveSettingsButton.trigger('click');
        return view.vm.$nextTick();
      }).then(() => {
        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          expect(request.config.data.get('default_presentation')).toBe(file);

          view.destroy();
          done();
        });
      });
    });
  });
});
