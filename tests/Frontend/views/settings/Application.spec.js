import { mount } from '@vue/test-utils';

import BootstrapVue, {
  BButton,
  BFormCheckbox,
  BFormFile,
  BFormInput,
  BFormTextarea,
  BImg
} from 'bootstrap-vue';
import Base from '../../../../resources/js/api/base';
import Application from '../../../../resources/js/views/settings/Application.vue';
import env from '../../../../resources/js/env.js';
import PermissionService from '../../../../resources/js/services/PermissionService';
import VSwatches from 'vue-swatches';
import { mockAxios, createContainer, createLocalVue } from '../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);

const bbbSettings = {
  file_mimes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png',
  max_filesize: 30,
  room_name_limit: 50,
  welcome_message_limit: 500,
  style: null,
  logo: null
};

describe('Application', () => {
  beforeEach(() => {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'applicationSettings.update', 'settings.manage'] });
    mockAxios.reset();
    mockAxios.request('/api/v1/getTimezones').respondWith({
      status: 200,
      data: {
        data: ['UTC', 'Europe/Berlin']
      }
    });
  });

  afterEach(() => {

  });

  it('getSettings method called, when the view is mounted', () => {
    const spy = vi.spyOn(Application.methods, 'getSettings').mockImplementation(() => {});

    expect(spy).toBeCalledTimes(0);

    mount(Application, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    expect(spy).toBeCalledTimes(1);
  });

  it('getSettings method works properly with response data room_limit is -1', async () => {
    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          room_token_expiration: 525600,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
    });
    await view.vm.$nextTick();

    expect(view.vm.$data.settings.logo).toBe('test.svg');
    expect(view.vm.$data.settings.room_limit).toBe(-1);
    expect(view.vm.$data.settings.pagination_page_size).toBe(10);
    expect(view.vm.$data.settings.room_pagination_page_size).toBe(5);
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
  });

  it('getSettings method works properly with response data room_limit is not -1', async () => {
    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: 32,
          room_token_expiration: 525600,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
    });
    await view.vm.$nextTick();
    expect(view.vm.$data.settings.logo).toBe('test.svg');
    expect(view.vm.$data.settings.room_limit).toBe(32);
    expect(view.vm.$data.settings.pagination_page_size).toBe(10);
    expect(view.vm.$data.settings.room_pagination_page_size).toBe(5);
    expect(view.vm.$data.roomLimitMode).toBe('custom');
    expect(view.vm.$data.settings.room_token_expiration).toBe(525600);
  });

  it('update room_token_expiration', async () => {
    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    // eslint-disable-next-line no-use-before-define
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: 32,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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

    const saveRequest = mockAxios.request('/api/v1/settings');

    saveSettingsButton.trigger('click');
    await view.vm.$nextTick();

    await saveRequest.wait();
    expect(saveRequest.config.data.get('room_token_expiration')).toStrictEqual('1440');
    await saveRequest.respondWith({
      status: 200,
      data: {
        data: {
          logo: 'test1.svg',
          room_limit: 33,
          pagination_page_size: 11,
          room_pagination_page_size: 6,
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
    expect(view.vm.$data.settings.room_pagination_page_size).toBe(6);
    expect(view.vm.$data.settings.room_token_expiration).toBe(1440);
    expect(view.vm.$data.roomLimitMode).toBe('custom');
    expect(view.vm.$data.isBusy).toBeFalsy();

    expect(view.vm.$data.settings.statistics.servers.enabled).toBeFalsy();
    expect(view.vm.$data.settings.statistics.meetings.enabled).toBeTruthy();
    expect(view.vm.$data.settings.attendance.enabled).toBeFalsy();
    expect(view.vm.$data.settings.statistics.servers.retention_period).toBe(14);
    expect(view.vm.$data.settings.statistics.meetings.retention_period).toBe(90);
    expect(view.vm.$data.settings.attendance.retention_period).toBe(7);
  });

  it('updateSettings method works properly with response data room_limit is -1', async () => {
    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: 32,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
    // Save button, which triggers updateSettings method when clicked
    const saveSettingsButton = view.find('#application-save-button');
    expect(saveSettingsButton.exists()).toBeTruthy();

    const saveRequest = mockAxios.request('/api/v1/settings');

    saveSettingsButton.trigger('click');
    await view.vm.$nextTick();

    await saveRequest.wait();
    await saveRequest.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test1.svg',
          room_limit: -1,
          pagination_page_size: 11,
          room_pagination_page_size: 6,
          default_timezone: 'Europe/Berlin',
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
    });
    await view.vm.$nextTick();

    expect(view.vm.$data.settings.logo).toBe('test1.svg');
    expect(view.vm.$data.settings.room_limit).toBe(-1);
    expect(view.vm.$data.settings.pagination_page_size).toBe(11);
    expect(view.vm.$data.settings.room_pagination_page_size).toBe(6);
    expect(view.vm.$data.roomLimitMode).toBe('unlimited');
    expect(view.vm.$data.isBusy).toBeFalsy();
    view.destroy();
  });

  it('roomLimitModeChanged method works properly', async () => {
    mockAxios.request('/api/v1/settings/all').respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: 32,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();

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
    view.destroy();
  });

  it('getSettings error handler', async () => {
    const request = mockAxios.request('/api/v1/settings/all');

    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(Application, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });
    await view.vm.$nextTick();

    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('updateSettings sends null values and booleans correctly to the backend', async () => {
    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: 32,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });
    let bannerFormGroup = view.findComponent({ ref: 'banner-form-group' });
    let bannerEnableBox = bannerFormGroup.findComponent(BFormCheckbox);
    expect(bannerEnableBox.props('checked')).toBe(true);
    await bannerEnableBox.get('input').trigger('click');

    bannerFormGroup = view.findComponent({ ref: 'banner-form-group' });
    bannerEnableBox = bannerFormGroup.findComponent(BFormCheckbox);
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

    const saveRequest = mockAxios.request('/api/v1/settings');

    saveSettingsButton.trigger('click');

    await saveRequest.wait();
    expect(saveRequest.config.data.get('banner[enabled]')).toStrictEqual('0');
    expect(saveRequest.config.data.get('banner[message]')).toStrictEqual('Test');
    expect(saveRequest.config.data.get('banner[color]')).toStrictEqual('#fff');
    expect(saveRequest.config.data.get('banner[background]')).toStrictEqual('#000');
    expect(saveRequest.config.data.get('banner[title]')).toStrictEqual('');
    expect(saveRequest.config.data.get('banner[icon]')).toStrictEqual('');
    expect(saveRequest.config.data.get('banner[link]')).toStrictEqual('');
    expect(saveRequest.config.data.get('help_url')).toStrictEqual('');

    expect(saveRequest.config.data.get('statistics[servers][enabled]')).toStrictEqual('0');
    expect(saveRequest.config.data.get('statistics[meetings][enabled]')).toStrictEqual('1');
    expect(saveRequest.config.data.get('attendance[enabled]')).toStrictEqual('0');
    expect(saveRequest.config.data.get('room_auto_delete[enabled]')).toStrictEqual('1');

    view.destroy();
  });

  it('updateSettings error handler', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: 32,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });
    // Save button, which triggers updateSettings method when clicked
    const saveSettingsButton = view.find('#application-save-button');
    expect(saveSettingsButton.exists()).toBeTruthy();

    const saveRequest = mockAxios.request('/api/v1/settings');

    saveSettingsButton.trigger('click');
    await view.vm.$nextTick();

    await saveRequest.wait();
    await saveRequest.respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });
    await view.vm.$nextTick();
    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('updateSettings error handler code 413', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: 32,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });
    // Errors data 'logo_file' array is undefined at the beginning
    expect(view.vm.$data.errors.logo_file).toBeUndefined();

    // Save button, which triggers updateSettings method when clicked
    const saveSettingsButton = view.find('#application-save-button');
    expect(saveSettingsButton.exists()).toBeTruthy();

    const saveRequest = mockAxios.request('/api/v1/settings');

    saveSettingsButton.trigger('click');
    await view.vm.$nextTick();

    await saveRequest.wait();
    await saveRequest.respondWith({
      status: env.HTTP_PAYLOAD_TOO_LARGE,
      data: {
        message: 'Test'
      }
    });
    await view.vm.$nextTick();
    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('updateSettings error handler code 422', async () => {
    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });
    // Errors data logo file array is undefined at the beginning
    expect(view.vm.$data.errors.pagination_page_size).toBeUndefined();

    // Save button, which triggers updateSettings method when clicked
    const saveSettingsButton = view.find('#application-save-button');
    expect(saveSettingsButton.exists()).toBeTruthy();

    const saveRequest = mockAxios.request('/api/v1/settings');

    saveSettingsButton.trigger('click');

    await saveRequest.wait();
    await saveRequest.respondWith({
      status: env.HTTP_UNPROCESSABLE_ENTITY,
      data: {
        errors: {
          logo: ['logo error'],
          room_limit: ['room limit error'],
          pagination_page_size: ['pagination page size error.'],
          room_pagination_page_size: ['own rooms pagination page size error'],
          help_url: ['help url error']
        }
      }
    });
    await view.vm.$nextTick();
    // Errors data populated accordingly to error response for this code
    expect(view.vm.$data.errors.logo.length).toBeGreaterThan(0);
    expect(view.vm.$data.errors.room_limit.length).toBeGreaterThan(0);
    expect(view.vm.$data.errors.pagination_page_size.length).toBeGreaterThan(0);
    expect(view.vm.$data.errors.room_pagination_page_size.length).toBeGreaterThan(0);
    expect(view.vm.$data.errors.help_url.length).toBeGreaterThan(0);

    view.destroy();
  });

  it('uploadLogoFile watcher called base64Encode method when value of data props uploadLogoFile changed', async () => {
    mockAxios.request('/api/v1/settings/all').respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: 32,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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

    const view = mount(Application, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();

    // base64Encode method spy
    const spy = vi.spyOn(view.vm, 'base64Encode');

    expect(spy).toBeCalledTimes(0);

    expect(view.vm.$data.uploadLogoFile).toBe(null);
    expect(view.vm.$data.uploadLogoFileSrc).toBe(null);

    // Trigger watcher by setting to data props uploadLogoFile, empty array to avoid test warn
    await view.setData({ uploadLogoFile: [] });

    // baseEncode64 method should be called after value change of uploadLogoFileSrc
    expect(spy).toBeCalledTimes(1);

    expect(view.vm.$data.uploadFaviconFile).toBe(null);
    expect(view.vm.$data.uploadFaviconFileSrc).toBe(null);

    await view.setData({ uploadFaviconFile: [] });

    expect(spy).toBeCalledTimes(2);

    expect(view.vm.$data.uploadBBBLogoFile).toBe(null);
    expect(view.vm.$data.uploadBBBLogoFileSrc).toBe(null);

    await view.setData({ uploadBBBLogoFile: [] });

    expect(spy).toBeCalledTimes(3);

    view.destroy();
  });

  it('disable edit button if user does not have permission', async () => {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'settings.manage'] });

    mockAxios.request('/api/v1/settings/all').respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: 32,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();

    // Save button should be missing
    const saveSettingsButton = view.find('#application-save-button');
    expect(saveSettingsButton.exists()).toBeFalsy();

    view.destroy();
  });

  it('delete default presentation button is not visible if the view is in view only mode', async () => {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'settings.manage'] });

    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });
    expect(view.findComponent({ ref: 'delete-default-presentation' }).exists()).toBe(false);
    view.destroy();
  });

  it('delete default presentation button is visible if the view is not in view only mode', async () => {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'settings.manage', 'applicationSettings.update'] });

    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });
    expect(view.findComponent({ ref: 'delete-default-presentation' }).exists()).toBe(true);
    view.destroy();
  });

  it('delete default presentation button is not visible if there is no default presentation or a new presentation was uploaded', async () => {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'settings.manage', 'applicationSettings.update'] });

    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });

    expect(view.findComponent({ ref: 'delete-default-presentation' }).exists()).toBe(false);
    // fake new upload
    view.setData({
      default_presentation: new window.File(['foo'], 'foo.txt', {
        type: 'text/plain',
        lastModified: Date.now()
      })
    });
    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'delete-default-presentation' }).exists()).toBe(false);
    view.destroy();
  });

  it('revert default presentation button is not visible if the view is in view only mode', async () => {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'settings.manage'] });

    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });
    await expect(view.findComponent({ ref: 'reset-default-presentation' }).exists()).toBe(false);
    view.destroy();
  });

  it('revert default presentation button is not visible if there is no new default presentation', async () => {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'applicationSettings.update', 'settings.manage'] });

    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });
    expect(view.findComponent({ ref: 'reset-default-presentation' }).exists()).toBe(false);
    // fake new upload
    view.setData({
      default_presentation: new window.File(['foo'], 'foo.txt', {
        type: 'text/plain',
        lastModified: Date.now()
      })
    });
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'reset-default-presentation' }).exists()).toBe(true);

    view.destroy();
  });

  it('view default presentation button is not visible if there is no default presentation even if a new was uploaded but not persisted', async () => {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'settings.manage', 'applicationSettings.update'] });

    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });
    expect(view.findComponent({ ref: 'view-default-presentation' }).exists()).toBe(false);
    // fake new upload
    view.setData({
      default_presentation: new window.File(['foo'], 'foo.txt', {
        type: 'text/plain',
        lastModified: Date.now()
      })
    });
    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'view-default-presentation' }).exists()).toBe(false);
    view.destroy();
  });

  it('if no new default presentation was uploaded the attribute does not get send with the request', async () => {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'applicationSettings.update', 'settings.manage'] });

    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });
    const saveSettingsButton = view.find('#application-save-button');
    expect(saveSettingsButton.exists()).toBeTruthy();

    const saveRequest = mockAxios.request('/api/v1/settings');

    saveSettingsButton.trigger('click');
    await view.vm.$nextTick();

    await saveRequest.wait();
    expect(saveRequest.config.data.has('default_presentation')).toBe(false);

    view.destroy();
  });

  it('if the default presentation was deleted the attribute gets send as null value the request', async () => {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'applicationSettings.update', 'settings.manage'] });

    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });
    view.findComponent({ ref: 'delete-default-presentation' }).trigger('click');

    const saveSettingsButton = view.find('#application-save-button');
    expect(saveSettingsButton.exists()).toBeTruthy();

    const saveRequest = mockAxios.request('/api/v1/settings');

    saveSettingsButton.trigger('click');
    await view.vm.$nextTick();

    await saveRequest.wait();
    expect(saveRequest.config.data.get('default_presentation')).toBe('');

    view.destroy();
  });

  it('if a new default presentation was uploaded the file gets send', async () => {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'applicationSettings.update', 'settings.manage'] });

    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    const file = new window.File(['foo'], 'foo.txt', {
      type: 'text/plain',
      lastModified: Date.now()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });
    view.setData({
      default_presentation: file
    });

    const saveSettingsButton = view.find('#application-save-button');
    expect(saveSettingsButton.exists()).toBeTruthy();

    const saveRequest = mockAxios.request('/api/v1/settings');

    saveSettingsButton.trigger('click');
    await view.vm.$nextTick();

    await saveRequest.wait();
    expect(saveRequest.config.data.get('default_presentation')).toBe(file);

    view.destroy();
  });

  it('bbb style', async () => {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'applicationSettings.update', 'settings.manage'] });

    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    const file = new window.File(['foo'], 'foo.css', {
      type: 'text/css',
      lastModified: Date.now()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
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

    let saveRequest = mockAxios.request('/api/v1/settings');

    saveSettingsButton.trigger('click');
    await view.vm.$nextTick();

    await saveRequest.wait();
    expect(saveRequest.config.data.get('bbb[style]')).toBe(file);
    await saveRequest.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });

    // check if buttons are visible after upload
    expect(formGroup.findAllComponents(BButton).length).toBe(2);
    // check view button
    let viewBtn = formGroup.findAllComponents(BButton).at(0);
    expect(viewBtn.html()).toContain('fa-solid fa-eye');
    expect(viewBtn.attributes('href')).toBe('http://localhost/storage/styles/bbb.css');

    saveRequest = mockAxios.request('/api/v1/settings');

    // save without changing anything
    saveSettingsButton.trigger('click');
    await view.vm.$nextTick();

    await saveRequest.wait();
    expect(saveRequest.config.data.get('bbb[style]')).toBeNull();
    await saveRequest.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });

    // delete file
    let deleteBtn = formGroup.findAllComponents(BButton).at(1);
    expect(deleteBtn.html()).toContain('fa-solid fa-trash');
    await deleteBtn.trigger('click');

    // check if delete button disappears and revert button is shown
    expect(formGroup.findAllComponents(BButton).length).toBe(2);
    viewBtn = formGroup.findAllComponents(BButton).at(0);
    const revertBtn = formGroup.findAllComponents(BButton).at(1);
    expect(revertBtn.html()).toContain('fa-solid fa-undo');

    // check if revert button disapears on click and delete button is shown
    await revertBtn.trigger('click');
    expect(formGroup.findAllComponents(BButton).length).toBe(2);
    viewBtn = formGroup.findAllComponents(BButton).at(0);
    deleteBtn = formGroup.findAllComponents(BButton).at(1);
    expect(deleteBtn.html()).toContain('fa-solid fa-trash');

    saveRequest = mockAxios.request('/api/v1/settings');

    // delete file and save
    await deleteBtn.trigger('click');
    await saveSettingsButton.trigger('click');
    await view.vm.$nextTick();

    await saveRequest.wait();
    expect(saveRequest.config.data.get('bbb[style]')).toBe('');
    await saveRequest.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });

    view.destroy();
  });

  it('bbb logo', async () => {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'applicationSettings.update', 'settings.manage'] });

    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    const img = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgNTAwIDUwMCIgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHRleHQgc3R5bGU9IndoaXRlLXNwYWNlOiBwcmU7IGZpbGw6IHJnYig1MSwgNTEsIDUxKTsgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmOyBmb250LXNpemU6IDE2LjNweDsiIHg9IjIwNi4wNTQiIHk9IjIzNy40ODUiPlRlc3QgTG9nbzwvdGV4dD4KPC9zdmc+';

    let resolvePromise;
    let base64EncodedPromise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
    });
    vi.spyOn(view.vm, 'base64Encode').mockImplementationOnce(() => {
      return new Promise((resolve) => {
        resolve(img);
        resolvePromise();
      });
    });

    const file = new window.File(['foo'], 'foo.png', {
      type: 'image/png',
      lastModified: Date.now()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });

    // check no buttons if no logo uploaded
    const formGroup = view.findComponent({ ref: 'bbb-logo-form-group' });
    expect(formGroup.findComponent(BFormInput).exists()).toBeTruthy();
    expect(formGroup.findComponent(BFormInput).element.value).toBe('');
    expect(formGroup.findAllComponents(BButton).length).toBe(0);
    expect(formGroup.findComponent(BImg).exists()).toBeFalsy();

    // set file and save
    await view.setData({
      uploadBBBLogoFile: file
    });
    await base64EncodedPromise;
    await view.vm.$nextTick();

    expect(formGroup.findComponent(BFormInput).exists()).toBeFalsy();
    expect(formGroup.findComponent(BImg).exists()).toBeTruthy();
    expect(formGroup.findComponent(BImg).attributes('src')).toBe(img);

    const saveSettingsButton = view.find('#application-save-button');
    expect(saveSettingsButton.exists()).toBeTruthy();

    let saveRequest = mockAxios.request('/api/v1/settings');

    await saveSettingsButton.trigger('click');
    await saveRequest.wait();
    expect(saveRequest.config.data.get('bbb[logo]')).toBeNull();
    expect(saveRequest.config.data.get('bbb[logo_file]')).toBe(file);

    await saveRequest.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
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

    saveRequest = mockAxios.request('/api/v1/settings');

    // save
    await saveSettingsButton.trigger('click');
    await saveRequest.wait();
    expect(saveRequest.config.data.get('bbb[logo]')).toBe('http://localhost/storage/logo2.png');
    expect(saveRequest.config.data.get('bbb[logo_file]')).toBeNull();

    await saveRequest.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });

    // check if image and image url are shown after upload
    expect(formGroup.findComponent(BFormInput).element.value).toBe('http://localhost/storage/logo2.png');
    expect(formGroup.findComponent(BImg).attributes('src')).toBe('http://localhost/storage/logo2.png');
    expect(formGroup.findComponent(BFormFile).exists()).toBeTruthy();

    // set file and save

    base64EncodedPromise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
    });
    vi.spyOn(view.vm, 'base64Encode').mockImplementationOnce(() => {
      return new Promise((resolve) => {
        resolve(img);
        resolvePromise();
      });
    });

    await view.setData({
      uploadBBBLogoFile: file
    });
    await base64EncodedPromise;
    await view.vm.$nextTick();

    expect(formGroup.findComponent(BFormInput).exists()).toBeFalsy();
    expect(formGroup.findComponent(BImg).attributes('src')).toBe(img);

    saveRequest = mockAxios.request('/api/v1/settings');

    // save
    await saveSettingsButton.trigger('click');
    await saveRequest.wait();
    expect(saveRequest.config.data.get('bbb[logo]')).toBeNull();
    expect(saveRequest.config.data.get('bbb[logo_file]')).toBe(file);
    await saveRequest.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });

    view.destroy();
  });

  it('bbb logo delete', async () => {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'applicationSettings.update', 'settings.manage'] });

    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
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
    expect(deleteBtn.html()).toContain('fa-solid fa-trash');
    await deleteBtn.trigger('click');

    // check if delete button and image disappears and revert button is shown
    expect(formGroup.findComponent(BFormFile).exists()).toBeFalsy();
    expect(formGroup.findComponent(BImg).exists()).toBeFalsy();
    const revertBtn = formGroup.findAllComponents(BButton).at(0);
    expect(revertBtn.html()).toContain('fa-solid fa-undo');

    // check if revert button disappears on click and delete button and image is shown
    await revertBtn.trigger('click');
    deleteBtn = formGroup.findAllComponents(BButton).at(0);
    expect(deleteBtn.html()).toContain('fa-solid fa-trash');
    expect(formGroup.findComponent(BFormFile).exists()).toBeTruthy();
    expect(formGroup.findComponent(BImg).exists()).toBeTruthy();

    const saveRequest = mockAxios.request('/api/v1/settings');

    // delete file and save
    await deleteBtn.trigger('click');
    await saveSettingsButton.trigger('click');

    await saveRequest.wait();
    expect(saveRequest.config.data.get('bbb[logo]')).toBeNull();
    expect(saveRequest.config.data.get('bbb[logo_file]')).toBeNull();
    await saveRequest.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
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
          },
          room_token_expiration: -1
        }
      }
    });

    view.destroy();
  });

  it('custom urls', async () => {
    PermissionService.setCurrentUser({ permissions: ['applicationSettings.viewAny', 'applicationSettings.update', 'settings.manage'] });

    const request = mockAxios.request('/api/v1/settings/all');

    const view = mount(Application, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
          banner: {
            enabled: false
          },
          help_url: 'http://www.pilos.com/help',
          legal_notice_url: 'http://www.pilos.com/legal',
          privacy_policy_url: 'http://www.pilos.com/privacy',
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
          },
          room_token_expiration: -1
        }
      }
    });

    // check if urls have been set
    expect(view.vm.$data.settings.help_url).toBe('http://www.pilos.com/help');
    expect(view.vm.$data.settings.legal_notice_url).toBe('http://www.pilos.com/legal');
    expect(view.vm.$data.settings.privacy_policy_url).toBe('http://www.pilos.com/privacy');

    const saveSettingsButton = view.find('#application-save-button');
    expect(saveSettingsButton.exists()).toBeTruthy();

    const saveRequest = mockAxios.request('/api/v1/settings');

    await saveSettingsButton.trigger('click');
    await saveRequest.wait();
    await saveRequest.respondWith({
      status: 200,
      data: {
        data: {
          name: 'App name',
          favicon: 'favicon.ico',
          logo: 'test.svg',
          room_limit: -1,
          pagination_page_size: 10,
          room_pagination_page_size: 5,
          default_timezone: 'Europe/Berlin',
          banner: {
            enabled: false
          },
          help_url: '',
          legal_notice_url: '',
          privacy_policy_url: '',
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
          },
          room_token_expiration: -1
        }
      }
    });

    // test if urls are empty
    expect(view.vm.$data.settings.help_url).toBe('');
    expect(view.vm.$data.settings.legal_notice_url).toBe('');
    expect(view.vm.$data.settings.privacy_policy_url).toBe('');

    view.destroy();
  });
});
