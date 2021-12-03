import { createLocalVue, mount } from '@vue/test-utils';
import moxios from 'moxios';
import BootstrapVue, {
  BButton,
  BFormCheckbox,
  BFormFile,
  BFormInput,
  BFormTextarea,
  BImg,
  IconsPlugin
} from 'bootstrap-vue';
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
  max_filesize: 30,
  room_name_limit: 50,
  welcome_message_limit: 500,
  style: null,
  logo: null
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
            room_token_expiration: 525600,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings,
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: true,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
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

        expect(view.vm.$data.settings.statistics.servers.enabled).toBeTruthy();
        expect(view.vm.$data.settings.statistics.meetings.enabled).toBeFalsy();
        expect(view.vm.$data.settings.attendance.enabled).toBeTruthy();
        expect(view.vm.$data.settings.statistics.servers.retention_period).toBe(7);
        expect(view.vm.$data.settings.statistics.meetings.retention_period).toBe(30);
        expect(view.vm.$data.settings.attendance.retention_period).toBe(14);
        expect(view.vm.$data.settings.room_token_expiration).toBe(525600);

        expect(view.vm.$data.settings.room_auto_delete.enabled).toBeTruthy();
        expect(view.vm.$data.settings.room_auto_delete.inactive_period).toBe(30);
        expect(view.vm.$data.settings.room_auto_delete.never_used_period).toBe(14);
        expect(view.vm.$data.settings.room_auto_delete.deadline_period).toBe(7);
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
            room_token_expiration: 525600,
            pagination_page_size: 10,
            own_rooms_pagination_page_size: 5,
            banner: {
              enabled: false
            },
            bbb: bbbSettings,
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: true,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
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
        expect(view.vm.$data.settings.room_token_expiration).toBe(525600);
        done();
      });
    });
  });

  it('update room_token_expiration', function (done) {
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

    moxios.wait(async () => {
      const request = moxios.requests.mostRecent();
      await request.respondWith({
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
            bbb: bbbSettings,
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: true,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            },
            room_token_expiration: -1
          }
        }
      });

      // Check if option is selected
      const roomTokenExpiration = view.find('#application-room-token-expiration');
      expect(roomTokenExpiration.exists()).toBeTruthy();
      expect(roomTokenExpiration.element.value).toBe('-1');
      expect(view.vm.$data.settings.room_token_expiration).toBe(-1);

      // Check change to other option
      await roomTokenExpiration.setValue('1440');
      expect(view.vm.$data.settings.room_token_expiration).toBe(1440);

      // Save button, which triggers updateSettings method when clicked
      const saveSettingsButton = view.find('#application-save-button');
      expect(saveSettingsButton.exists()).toBeTruthy();
      saveSettingsButton.trigger('click');
      await view.vm.$nextTick();

      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.data.get('room_token_expiration')).toStrictEqual('1440');
        await request.respondWith({
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
              bbb: bbbSettings,
              statistics: {
                servers: {
                  enabled: false,
                  retention_period: 14
                },
                meetings: {
                  enabled: true,
                  retention_period: 90
                }
              },
              attendance: {
                enabled: false,
                retention_period: 7
              },
              room_auto_delete: {
                enabled: true,
                inactive_period: 30,
                never_used_period: 14,
                deadline_period: 7
              },
              room_token_expiration: 1440
            }
          }
        });
        await view.vm.$nextTick();

        expect(view.vm.$data.settings.logo).toBe('test1.svg');
        expect(view.vm.$data.settings.room_limit).toBe(33);
        expect(view.vm.$data.settings.pagination_page_size).toBe(11);
        expect(view.vm.$data.settings.own_rooms_pagination_page_size).toBe(6);
        expect(view.vm.$data.settings.room_token_expiration).toBe(1440);
        expect(view.vm.$data.roomLimitMode).toBe('custom');
        expect(view.vm.$data.isBusy).toBeFalsy();

        expect(view.vm.$data.settings.statistics.servers.enabled).toBeFalsy();
        expect(view.vm.$data.settings.statistics.meetings.enabled).toBeTruthy();
        expect(view.vm.$data.settings.attendance.enabled).toBeFalsy();
        expect(view.vm.$data.settings.statistics.servers.retention_period).toBe(14);
        expect(view.vm.$data.settings.statistics.meetings.retention_period).toBe(90);
        expect(view.vm.$data.settings.attendance.retention_period).toBe(7);
        done();
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
            bbb: bbbSettings,
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: true,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
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
                bbb: bbbSettings,
                statistics: {
                  servers: {
                    enabled: true,
                    retention_period: 7
                  },
                  meetings: {
                    enabled: false,
                    retention_period: 30
                  }
                },
                attendance: {
                  enabled: true,
                  retention_period: 14
                },
                room_auto_delete: {
                  enabled: true,
                  inactive_period: 30,
                  never_used_period: 14,
                  deadline_period: 7
                }
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
            help_url: null,
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: false,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
          }
        }
      }).then(() => {
        const bannerFormGroup = view.findComponent({ ref: 'banner-form-group' });
        const bannerEnableBox = bannerFormGroup.findComponent(BFormCheckbox);
        expect(bannerEnableBox.props('checked')).toBe(true);
        return bannerEnableBox.get('input').trigger('click');
      }).then(async () => {
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

        const statisticsServersEnabledCheckbox = view.findComponent({ ref: 'statistics-servers-enabled-form-group' }).findComponent(BFormCheckbox);
        expect(statisticsServersEnabledCheckbox.props('checked')).toBe(true);
        await statisticsServersEnabledCheckbox.get('input').trigger('click');

        const statisticsMeetingsEnabledCheckbox = view.findComponent({ ref: 'statistics-meetings-enabled-form-group' }).findComponent(BFormCheckbox);
        expect(statisticsMeetingsEnabledCheckbox.props('checked')).toBe(false);
        await statisticsMeetingsEnabledCheckbox.get('input').trigger('click');

        const attendanceEnabledCheckbox = view.findComponent({ ref: 'attendance-enabled-form-group' }).findComponent(BFormCheckbox);
        expect(attendanceEnabledCheckbox.props('checked')).toBe(true);
        await attendanceEnabledCheckbox.get('input').trigger('click');

        const roomAutoDeleteEnabledCheckbox = view.findComponent({ ref: 'application-room-auto-delete-enabled-form-group' }).findComponent(BFormCheckbox);
        expect(roomAutoDeleteEnabledCheckbox.props('checked')).toBe(false);
        await roomAutoDeleteEnabledCheckbox.get('input').trigger('click');

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

          expect(request.config.data.get('statistics[servers][enabled]')).toStrictEqual('0');
          expect(request.config.data.get('statistics[meetings][enabled]')).toStrictEqual('1');
          expect(request.config.data.get('attendance[enabled]')).toStrictEqual('0');
          expect(request.config.data.get('room_auto_delete[enabled]')).toStrictEqual('1');

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
            bbb: bbbSettings,
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: false,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
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
            bbb: bbbSettings,
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: false,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
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
            bbb: bbbSettings,
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: false,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
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

    expect(view.vm.$data.uploadBBBLogoFile).toBe(null);
    expect(view.vm.$data.uploadBBBLogoFileSrc).toBe(null);

    await view.setData({ uploadBBBLogoFile: [] });

    expect(spy.calledThrice).toBeTruthy();
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
            default_presentation: 'foo.pdf',
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: false,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
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
            default_presentation: 'foo.pdf',
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: false,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
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
            bbb: bbbSettings,
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: false,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
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
            default_presentation: 'foo.pdf',
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: false,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
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
            default_presentation: 'foo.pdf',
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: false,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
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
            bbb: bbbSettings,
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: false,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
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
            default_presentation: 'foo.pdf',
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: false,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
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
            default_presentation: 'foo.pdf',
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: false,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
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
            default_presentation: 'foo.pdf',
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: false,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
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

  it('bbb style', function (done) {
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

    const file = new window.File(['foo'], 'foo.css', {
      type: 'text/css',
      lastModified: Date.now()
    });

    moxios.wait(async () => {
      const request = moxios.requests.mostRecent();

      await request.respondWith({
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
            default_presentation: 'foo.pdf',
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: false,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
          }
        }
      });

      // check no buttons if no style uploaded
      const formGroup = view.findComponent({ ref: 'bbb-style-form-group' });
      expect(formGroup.findAllComponents(BButton).length).toBe(0);

      // set file and save
      view.setData({
        bbb_style: file
      });
      const saveSettingsButton = view.find('#application-save-button');
      expect(saveSettingsButton.exists()).toBeTruthy();
      saveSettingsButton.trigger('click');
      await view.vm.$nextTick();

      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.data.get('bbb[style]')).toBe(file);

        await request.respondWith({
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
              bbb: {
                file_mimes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png',
                max_filesize: 30,
                room_name_limit: 50,
                welcome_message_limit: 500,
                style: 'http://localhost/storage/styles/bbb.css'
              },
              default_presentation: 'foo.pdf',
              statistics: {
                servers: {
                  enabled: true,
                  retention_period: 7
                },
                meetings: {
                  enabled: false,
                  retention_period: 30
                }
              },
              attendance: {
                enabled: true,
                retention_period: 14
              },
              room_auto_delete: {
                enabled: false,
                inactive_period: 30,
                never_used_period: 14,
                deadline_period: 7
              }
            }
          }
        });

        // check if buttons are visible after upload
        expect(formGroup.findAllComponents(BButton).length).toBe(2);
        // check view button
        let viewBtn = formGroup.findAllComponents(BButton).at(0);
        expect(viewBtn.html()).toContain('fas fa-eye');
        expect(viewBtn.attributes('href')).toBe('http://localhost/storage/styles/bbb.css');

        // save without changing anything
        saveSettingsButton.trigger('click');
        await view.vm.$nextTick();

        moxios.wait(async () => {
          const request = moxios.requests.mostRecent();
          expect(request.config.data.get('bbb[style]')).toBeNull();

          await request.respondWith({
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
                bbb: {
                  file_mimes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png',
                  max_filesize: 30,
                  room_name_limit: 50,
                  welcome_message_limit: 500,
                  style: 'http://localhost/storage/styles/bbb.css'
                },
                default_presentation: 'foo.pdf',
                statistics: {
                  servers: {
                    enabled: true,
                    retention_period: 7
                  },
                  meetings: {
                    enabled: false,
                    retention_period: 30
                  }
                },
                attendance: {
                  enabled: true,
                  retention_period: 14
                },
                room_auto_delete: {
                  enabled: false,
                  inactive_period: 30,
                  never_used_period: 14,
                  deadline_period: 7
                }
              }
            }
          });

          // delete file
          let deleteBtn = formGroup.findAllComponents(BButton).at(1);
          expect(deleteBtn.html()).toContain('fas fa-trash');
          await deleteBtn.trigger('click');

          // check if delete button disappears and revert button is shown
          expect(formGroup.findAllComponents(BButton).length).toBe(2);
          viewBtn = formGroup.findAllComponents(BButton).at(0);
          const revertBtn = formGroup.findAllComponents(BButton).at(1);
          expect(revertBtn.html()).toContain('fas fa-undo');

          // check if revert button disapears on click and delete button is shown
          await revertBtn.trigger('click');
          expect(formGroup.findAllComponents(BButton).length).toBe(2);
          viewBtn = formGroup.findAllComponents(BButton).at(0);
          deleteBtn = formGroup.findAllComponents(BButton).at(1);
          expect(deleteBtn.html()).toContain('fas fa-trash');

          // delete file and save
          await deleteBtn.trigger('click');
          await saveSettingsButton.trigger('click');
          await view.vm.$nextTick();

          moxios.wait(async () => {
            const request = moxios.requests.mostRecent();
            expect(request.config.data.get('bbb[style]')).toBe('');

            await request.respondWith({
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
                  bbb: {
                    file_mimes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png',
                    max_filesize: 30,
                    room_name_limit: 50,
                    welcome_message_limit: 500,
                    style: null
                  },
                  default_presentation: 'foo.pdf',
                  statistics: {
                    servers: {
                      enabled: true,
                      retention_period: 7
                    },
                    meetings: {
                      enabled: false,
                      retention_period: 30
                    }
                  },
                  attendance: {
                    enabled: true,
                    retention_period: 14
                  },
                  room_auto_delete: {
                    enabled: false,
                    inactive_period: 30,
                    never_used_period: 14,
                    deadline_period: 7
                  }
                }
              }
            });

            view.destroy();
            done();
          });
        });
      });
    });
  });

  it('bbb logo', function (done) {
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

    const img = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgNTAwIDUwMCIgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHRleHQgc3R5bGU9IndoaXRlLXNwYWNlOiBwcmU7IGZpbGw6IHJnYig1MSwgNTEsIDUxKTsgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmOyBmb250LXNpemU6IDE2LjNweDsiIHg9IjIwNi4wNTQiIHk9IjIzNy40ODUiPlRlc3QgTG9nbzwvdGV4dD4KPC9zdmc+';

    sinon.replace(view.vm, 'base64Encode', sinon.fake.resolves(img));

    const file = new window.File(['foo'], 'foo.png', {
      type: 'image/png',
      lastModified: Date.now()
    });

    moxios.wait(async () => {
      const request = moxios.requests.mostRecent();

      await request.respondWith({
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
            default_presentation: 'foo.pdf',
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: false,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
          }
        }
      });

      // check no buttons if no style uploaded
      const formGroup = view.findComponent({ ref: 'bbb-logo-form-group' });
      expect(formGroup.findComponent(BFormInput).exists()).toBeTruthy();
      expect(formGroup.findComponent(BFormInput).element.value).toBe('');
      expect(formGroup.findAllComponents(BButton).length).toBe(0);
      expect(formGroup.findComponent(BImg).exists()).toBeFalsy();

      // set file and save
      await view.setData({
        uploadBBBLogoFile: file
      });
      await view.vm.$nextTick();

      expect(formGroup.findComponent(BFormInput).exists()).toBeFalsy();
      expect(formGroup.findComponent(BImg).exists()).toBeTruthy();
      expect(formGroup.findComponent(BImg).attributes('src')).toBe(img);

      const saveSettingsButton = view.find('#application-save-button');
      expect(saveSettingsButton.exists()).toBeTruthy();
      await saveSettingsButton.trigger('click');
      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.data.get('bbb[logo]')).toBeNull();
        expect(request.config.data.get('bbb[logo_file]')).toBe(file);

        await request.respondWith({
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
              bbb: {
                file_mimes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png',
                max_filesize: 30,
                room_name_limit: 50,
                welcome_message_limit: 500,
                style: null,
                logo: 'http://localhost/storage/logo.png'
              },
              default_presentation: 'foo.pdf',
              statistics: {
                servers: {
                  enabled: true,
                  retention_period: 7
                },
                meetings: {
                  enabled: false,
                  retention_period: 30
                }
              },
              attendance: {
                enabled: true,
                retention_period: 14
              },
              room_auto_delete: {
                enabled: false,
                inactive_period: 30,
                never_used_period: 14,
                deadline_period: 7
              }
            }
          }
        });

        // check if image and image url are shown after upload
        expect(formGroup.findComponent(BFormInput).exists()).toBeTruthy();
        expect(formGroup.findComponent(BFormInput).element.value).toBe('http://localhost/storage/logo.png');
        expect(formGroup.findComponent(BImg).exists()).toBeTruthy();
        expect(formGroup.findComponent(BImg).attributes('src')).toBe('http://localhost/storage/logo.png');

        // change url
        await formGroup.findComponent(BFormInput).setValue('http://localhost/storage/logo2.png');
        expect(formGroup.findComponent(BImg).attributes('src')).toBe('http://localhost/storage/logo2.png');

        // save
        await saveSettingsButton.trigger('click');
        moxios.wait(async () => {
          const request = moxios.requests.mostRecent();
          expect(request.config.data.get('bbb[logo]')).toBe('http://localhost/storage/logo2.png');
          expect(request.config.data.get('bbb[logo_file]')).toBeNull();

          await request.respondWith({
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
                bbb: {
                  file_mimes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png',
                  max_filesize: 30,
                  room_name_limit: 50,
                  welcome_message_limit: 500,
                  style: null,
                  logo: 'http://localhost/storage/logo2.png'
                },
                default_presentation: 'foo.pdf',
                statistics: {
                  servers: {
                    enabled: true,
                    retention_period: 7
                  },
                  meetings: {
                    enabled: false,
                    retention_period: 30
                  }
                },
                attendance: {
                  enabled: true,
                  retention_period: 14
                },
                room_auto_delete: {
                  enabled: false,
                  inactive_period: 30,
                  never_used_period: 14,
                  deadline_period: 7
                }
              }
            }
          });

          // check if image and image url are shown after upload
          expect(formGroup.findComponent(BFormInput).element.value).toBe('http://localhost/storage/logo2.png');
          expect(formGroup.findComponent(BImg).attributes('src')).toBe('http://localhost/storage/logo2.png');
          expect(formGroup.findComponent(BFormFile).exists()).toBeTruthy();

          // set file and save
          await view.setData({
            uploadBBBLogoFile: file
          });
          await view.vm.$nextTick();

          expect(formGroup.findComponent(BFormInput).exists()).toBeFalsy();
          expect(formGroup.findComponent(BImg).attributes('src')).toBe(img);

          // save
          await saveSettingsButton.trigger('click');
          moxios.wait(async () => {
            const request = moxios.requests.mostRecent();
            expect(request.config.data.get('bbb[logo]')).toBeNull();
            expect(request.config.data.get('bbb[logo_file]')).toBe(file);

            await request.respondWith({
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
                  bbb: {
                    file_mimes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png',
                    max_filesize: 30,
                    room_name_limit: 50,
                    welcome_message_limit: 500,
                    style: null,
                    logo: 'http://localhost/storage/logo3.png'
                  },
                  default_presentation: 'foo.pdf',
                  statistics: {
                    servers: {
                      enabled: true,
                      retention_period: 7
                    },
                    meetings: {
                      enabled: false,
                      retention_period: 30
                    }
                  },
                  attendance: {
                    enabled: true,
                    retention_period: 14
                  },
                  room_auto_delete: {
                    enabled: false,
                    inactive_period: 30,
                    never_used_period: 14,
                    deadline_period: 7
                  }
                }
              }
            });

            sinon.restore();
            view.destroy();
            done();
          });
        });
      });
    });
  });

  it('bbb logo delete', function (done) {
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

    moxios.wait(async () => {
      const request = moxios.requests.mostRecent();

      await request.respondWith({
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
            bbb: {
              file_mimes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png',
              max_filesize: 30,
              room_name_limit: 50,
              welcome_message_limit: 500,
              style: null,
              logo: 'http://localhost/storage/logo.png'
            },
            default_presentation: 'foo.pdf',
            statistics: {
              servers: {
                enabled: true,
                retention_period: 7
              },
              meetings: {
                enabled: false,
                retention_period: 30
              }
            },
            attendance: {
              enabled: true,
              retention_period: 14
            },
            room_auto_delete: {
              enabled: false,
              inactive_period: 30,
              never_used_period: 14,
              deadline_period: 7
            }
          }
        }
      });

      const formGroup = view.findComponent({ ref: 'bbb-logo-form-group' });
      const saveSettingsButton = view.find('#application-save-button');

      // check if file upload and image exists
      expect(formGroup.findComponent(BFormFile).exists()).toBeTruthy();
      expect(formGroup.findComponent(BImg).exists()).toBeTruthy();

      // delete file
      let deleteBtn = formGroup.findAllComponents(BButton).at(0);
      expect(deleteBtn.html()).toContain('fas fa-trash');
      await deleteBtn.trigger('click');

      // check if delete button and image disappears and revert button is shown
      expect(formGroup.findComponent(BFormFile).exists()).toBeFalsy();
      expect(formGroup.findComponent(BImg).exists()).toBeFalsy();
      const revertBtn = formGroup.findAllComponents(BButton).at(0);
      expect(revertBtn.html()).toContain('fas fa-undo');

      // check if revert button disappears on click and delete button and image is shown
      await revertBtn.trigger('click');
      deleteBtn = formGroup.findAllComponents(BButton).at(0);
      expect(deleteBtn.html()).toContain('fas fa-trash');
      expect(formGroup.findComponent(BFormFile).exists()).toBeTruthy();
      expect(formGroup.findComponent(BImg).exists()).toBeTruthy();

      // delete file and save
      await deleteBtn.trigger('click');
      await saveSettingsButton.trigger('click');

      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.data.get('bbb[logo]')).toBeNull();
        expect(request.config.data.get('bbb[logo_file]')).toBeNull();

        await request.respondWith({
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
              bbb: {
                file_mimes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png',
                max_filesize: 30,
                room_name_limit: 50,
                welcome_message_limit: 500,
                style: null,
                logo: null
              },
              default_presentation: 'foo.pdf',
              statistics: {
                servers: {
                  enabled: true,
                  retention_period: 7
                },
                meetings: {
                  enabled: false,
                  retention_period: 30
                }
              },
              attendance: {
                enabled: true,
                retention_period: 14
              },
              room_auto_delete: {
                enabled: false,
                inactive_period: 30,
                never_used_period: 14,
                deadline_period: 7
              }
            }
          }
        });

        sinon.restore();
        view.destroy();
        done();
      });
    });
  });
});
