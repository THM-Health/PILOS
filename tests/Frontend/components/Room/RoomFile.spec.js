import { mount } from '@vue/test-utils';
import BootstrapVue, { BButton, BFormFile, BFormInvalidFeedback, BModal, BTbody } from 'bootstrap-vue';
import FileComponent from '@/components/Room/FileComponent.vue';

import Base from '@/api/base';
import PermissionService from '@/services/PermissionService';
import _ from 'lodash';
import { waitModalHidden, waitModalShown, mockAxios, createContainer, createLocalVue } from '../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { EVENT_CURRENT_ROOM_CHANGED } from '@/constants/events';
import EventBus from '@/services/EventBus';

const localVue = createLocalVue();

localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };
const ownerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false };
const coOwnerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 2, name: 'John Doe' }, type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: true, is_co_owner: true, is_moderator: false, can_start: false, running: false };
const exampleRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false };

describe('RoomFile', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('load files', async () => {
    const request = mockAxios.request('/api/v1/rooms/123-456-789/files');

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: exampleRoom,
        showTitle: true
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await request.wait();

    expect(request.config.headers['Access-Code']).toBeUndefined();
    expect(request.config.headers.Token).toBeUndefined();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          files: [
            { id: 1, filename: 'File1.pdf', download: true, use_in_meeting: false, default: false, uploaded: '2020-09-21T07:08:00.000000Z' },
            { id: 2, filename: 'File2.pdf', download: true, use_in_meeting: true, default: true, uploaded: '2020-09-21T07:08:00.000000Z' },
            { id: 3, filename: 'File3.pdf', download: false, use_in_meeting: false, default: false, uploaded: '2020-09-21T07:09:00.000000Z' }
          ],
          default: 2
        }
      }
    });

    expect(view.vm.$data.files.files).toHaveLength(3);
    view.destroy();
  });

  it('load files with access code', async () => {
    const request = mockAxios.request('/api/v1/rooms/123-456-789/files');

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        accessCode: 396856824,
        room: exampleRoom,
        showTitle: true
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await request.wait();

    expect(request.config.headers['Access-Code']).toBe('396856824');
    expect(request.config.headers.Token).toBeUndefined();
    view.destroy();
  });

  it('load files with token', async () => {
    const request = mockAxios.request('/api/v1/rooms/123-456-789/files');

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR',
        room: exampleRoom,
        showTitle: true
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await request.wait();
    expect(request.config.headers['Access-Code']).toBeUndefined();
    expect(request.config.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    view.destroy();
  });

  it('reload on EventBus message', async () => {
    const reloadSpy = vi.spyOn(FileComponent.methods, 'reload').mockImplementation(() => {});

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: exampleRoom,
        showTitle: true
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });
    await view.vm.$nextTick();

    // check for initial reload
    expect(reloadSpy).toBeCalledTimes(1);
    EventBus.emit(EVENT_CURRENT_ROOM_CHANGED, this.room);

    // check for reload triggered by EventBus
    expect(reloadSpy).toBeCalledTimes(2);

    view.destroy();
  });

  it('hide table fields and upload', async () => {
    PermissionService.setCurrentUser(exampleUser);

    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 200,
      data: {
        data: {
          files: [],
          default: null
        }
      }
    });

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom,
        showTitle: true
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await view.vm.$nextTick();
    expect(view.findComponent(BFormFile).exists()).toBeFalsy();

    const fields = view.vm.filefields.map(a => a.key);
    expect(fields).toContain('filename');
    expect(fields).toContain('uploaded');
    expect(fields).toContain('actions');
    expect(fields).not.toContain('download');
    expect(fields).not.toContain('use_in_meeting');
    expect(fields).not.toContain('default');

    view.destroy();
  });

  it('show owner upload and all table fields', async () => {
    PermissionService.setCurrentUser(exampleUser);

    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 200,
      data: {
        data: {
          files: [],
          default: null
        }
      }
    });

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: ownerRoom,
        showTitle: true
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });
    await view.vm.$nextTick();
    expect(view.findComponent(BFormFile).exists()).toBeTruthy();

    const fields = view.vm.filefields.map(a => a.key);
    expect(fields).toContain('filename');
    expect(fields).toContain('uploaded');
    expect(fields).toContain('actions');
    expect(fields).toContain('download');
    expect(fields).toContain('use_in_meeting');
    expect(fields).toContain('default');
    view.destroy();
  });

  it('show co-owner upload and all table fields', async () => {
    PermissionService.setCurrentUser(exampleUser);

    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 200,
      data: {
        data: {
          files: [],
          default: null
        }
      }
    });

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: coOwnerRoom,
        showTitle: true
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });
    await view.vm.$nextTick();
    expect(view.findComponent(BFormFile).exists()).toBeTruthy();

    const fields = view.vm.filefields.map(a => a.key);
    expect(fields).toContain('filename');
    expect(fields).toContain('uploaded');
    expect(fields).toContain('actions');
    expect(fields).toContain('download');
    expect(fields).toContain('use_in_meeting');
    expect(fields).toContain('default');

    view.destroy();
  });

  it('hide upload and manage table fields on room.viewAll permission', async () => {
    const oldUser = PermissionService.currentUser;

    const newUser = _.clone(exampleUser);
    newUser.permissions = ['rooms.viewAll'];
    PermissionService.setCurrentUser(newUser);

    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 200,
      data: {
        data: {
          files: [],
          default: null
        }
      }
    });

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom,
        showTitle: true
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });
    await view.vm.$nextTick();
    expect(view.findComponent(BFormFile).exists()).toBeFalsy();

    const fields = view.vm.filefields.map(a => a.key);
    expect(fields).toContain('filename');
    expect(fields).toContain('uploaded');
    expect(fields).toContain('actions');
    expect(fields).not.toContain('download');
    expect(fields).not.toContain('use_in_meeting');
    expect(fields).not.toContain('default');

    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('show upload and manage table fields on room.manage permission', async () => {
    const oldUser = PermissionService.currentUser;

    const newUser = _.clone(exampleUser);
    newUser.permissions = ['rooms.manage'];
    PermissionService.setCurrentUser(newUser);

    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 200,
      data: {
        data: {
          files: [],
          default: null
        }
      }
    });

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom,
        showTitle: true
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });
    await view.vm.$nextTick();
    expect(view.findComponent(BFormFile).exists()).toBeTruthy();

    const fields = view.vm.filefields.map(a => a.key);
    expect(fields).toContain('filename');
    expect(fields).toContain('uploaded');
    expect(fields).toContain('actions');
    expect(fields).toContain('download');
    expect(fields).toContain('use_in_meeting');
    expect(fields).toContain('default');

    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('upload file', async () => {
    const oldUser = PermissionService.currentUser;

    const newUser = _.clone(exampleUser);
    newUser.permissions = ['rooms.manage'];
    PermissionService.setCurrentUser(newUser);

    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 200,
      data: {
        data: {
          files: [],
          default: null
        }
      }
    });

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: exampleRoom,
        showTitle: true
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.vm.$data.files.files).toHaveLength(0);
    expect(view.findComponent(BFormFile).exists()).toBeTruthy();
    const file = new window.File(['foo'], 'foo.txt', {
      type: 'text/plain',
      lastModified: Date.now()
    });

    const request = mockAxios.request('/api/v1/rooms/123-456-789/files');

    view.vm.uploadFile(file);

    await request.wait();
    expect(request.config.headers['Content-Type']).toBe('multipart/form-data');
    expect(request.config.method).toBe('post');
    expect(request.config.data.get('file')).toBe(file);

    await request.respondWith({
      status: 200,
      data: {
        data: {
          files: [
            { id: 1, filename: 'File1.pdf', download: true, use_in_meeting: false, default: false, uploaded: '2020-09-21T07:08:00.000000Z' }
          ],
          default: null
        }
      }
    });

    await view.vm.$nextTick();
    expect(view.vm.$data.files.files).toHaveLength(1);

    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('upload file payload too large error', async () => {
    const oldUser = PermissionService.currentUser;

    const newUser = _.clone(exampleUser);
    newUser.permissions = ['rooms.manage'];
    PermissionService.setCurrentUser(newUser);

    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 200,
      data: {
        data: {
          files: [],
          default: null
        }
      }
    });

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: exampleRoom,
        showTitle: true
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const file = new window.File(['foo'], 'foo.txt', {
      type: 'text/plain',
      lastModified: Date.now()
    });

    expect(view.findComponent(BFormInvalidFeedback).text()).toBe('');

    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 413
    });

    view.vm.uploadFile({ target: { files: [file] } });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent(BFormInvalidFeedback).text()).toBe('app.validation.too_large');
    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('upload file form validation', async () => {
    const oldUser = PermissionService.currentUser;

    const newUser = _.clone(exampleUser);
    newUser.permissions = ['rooms.manage'];
    PermissionService.setCurrentUser(newUser);

    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 200,
      data: {
        data: {
          files: [],
          default: null
        }
      }
    });

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: exampleRoom,
        showTitle: true
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const file = new window.File(['foo'], 'foo.txt', {
      type: 'text/plain',
      lastModified: Date.now()
    });

    expect(view.findComponent(BFormInvalidFeedback).text()).toBe('');

    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 422,
      data: {
        message: 'The given data was invalid.',
        errors: {
          file: ['The File must be a file of type: pdf, doc.']
        }
      }
    });

    view.vm.uploadFile({ target: { files: [file] } });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent(BFormInvalidFeedback).text()).toBe('The File must be a file of type: pdf, doc.');
    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('upload file other errors', async () => {
    const oldUser = PermissionService.currentUser;
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});
    const newUser = _.clone(exampleUser);
    newUser.permissions = ['rooms.manage'];
    PermissionService.setCurrentUser(newUser);

    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 200,
      data: {
        data: {
          files: [],
          default: null
        }
      }
    });

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: exampleRoom,
        showTitle: true
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const file = new window.File(['foo'], 'foo.txt', {
      type: 'text/plain',
      lastModified: Date.now()
    });

    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 500,
      data: {
        message: 'Internal server error'
      }
    });

    view.vm.uploadFile({ target: { files: [file] } });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);
    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('error handling on files load', async () => {
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});

    // Test 403, code required
    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 403,
      data: {
        message: 'require_code'
      }
    });

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: exampleRoom,
        showTitle: true,
        emitErrors: true
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.emitted('invalid-code').length).toBe(1);

    // Test 401, code invalid
    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 401,
      data: {
        message: 'invalid_code'
      }
    });

    view.vm.reload();
    await mockAxios.wait();

    expect(view.emitted('invalid-code').length).toBe(2);

    // Test 401, token invalid
    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 401,
      data: {
        message: 'invalid_token'
      }
    });

    view.vm.reload();
    await mockAxios.wait();

    expect(view.emitted('invalid-token').length).toBe(1);

    // Test other errors
    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    view.vm.reload();
    await mockAxios.wait();

    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);

    view.destroy();
  });

  it('remove file', async () => {
    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 200,
      data: {
        data: {
          files: [
            {
              id: 1,
              filename: 'File1.pdf',
              download: true,
              use_in_meeting: false,
              default: false,
              uploaded: '2020-09-21T07:08:00.000000Z'
            },
            {
              id: 2,
              filename: 'File2.pdf',
              download: true,
              use_in_meeting: true,
              default: true,
              uploaded: '2020-09-21T07:08:00.000000Z'
            },
            {
              id: 3,
              filename: 'File3.pdf',
              download: false,
              use_in_meeting: false,
              default: false,
              uploaded: '2020-09-21T07:09:00.000000Z'
            }
          ],
          default: 2
        }
      }
    });

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: ownerRoom,
        showTitle: true
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.vm.$data.files.files).toHaveLength(3);
    view.vm.removeFile(view.vm.$data.files.files[0]);
    expect(view.vm.$data.files.files).toHaveLength(2);
    view.destroy();
  });

  it('delete file', async () => {
    PermissionService.setCurrentUser(exampleUser);
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});
    const toastErrorSpy = vi.fn();

    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 200,
      data: {
        data: {
          files: [
            {
              id: 1,
              filename: 'File1.pdf',
              download: true,
              use_in_meeting: false,
              default: false,
              uploaded: '2020-09-21T07:08:00.000000Z'
            },
            {
              id: 2,
              filename: 'File2.pdf',
              download: true,
              use_in_meeting: true,
              default: true,
              uploaded: '2020-09-21T07:08:00.000000Z'
            },
            {
              id: 3,
              filename: 'File3.pdf',
              download: false,
              use_in_meeting: false,
              default: false,
              uploaded: '2020-09-21T07:09:00.000000Z'
            }
          ],
          default: 2
        }
      }
    });

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString(),
        toastError: toastErrorSpy
      },
      propsData: {
        room: ownerRoom,
        showTitle: true,
        modalStatic: true
      },
      pinia: createTestingPinia(),
      attachTo: createContainer(),
      stubs: {
        transition: false
      }
    });

    // load files
    await mockAxios.wait();
    await view.vm.$nextTick();

    // check if all files found
    expect(view.vm.$data.files.files).toHaveLength(3);

    // get first table entry and check cols
    let fileTable = view.findComponent(BTbody);
    let tableRows = fileTable.findAll('tr');
    expect(tableRows).toHaveLength(3);
    let tableCols = tableRows.at(0).findAll('td');
    expect(tableCols).toHaveLength(6);

    // find delete action button and click
    let deleteButton = tableCols.at(5).findAll('button').at(0);
    expect(deleteButton.html()).toContain('class="fa-solid fa-trash"');

    await view.vm.$nextTick();

    expect(view.findComponent(BModal).find('.modal').element.style.display).toEqual('none');
    await waitModalShown(view, () => {
      deleteButton.trigger('click');
    });

    // open modal and confirm delete
    expect(view.findComponent(BModal).find('.modal').element.style.display).toEqual('block');

    const deleteFile3Request = mockAxios.request('/api/v1/rooms/123-456-789/files/3');

    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');

    // check for delete requests
    await deleteFile3Request.wait();
    expect(deleteFile3Request.config.method).toEqual('delete');
    await waitModalHidden(view, async () => {
      await deleteFile3Request.respondWith({
        status: 200,
        data: {
          data: {
            files: [
              {
                id: 1,
                filename: 'File1.pdf',
                download: true,
                use_in_meeting: false,
                default: false,
                uploaded: '2020-09-21T07:08:00.000000Z'
              },
              {
                id: 2,
                filename: 'File2.pdf',
                download: true,
                use_in_meeting: true,
                default: true,
                uploaded: '2020-09-21T07:09:00.000000Z'
              }
            ],
            default: 2
          }
        }
      });
    });

    // check if file list was updated
    expect(view.vm.$data.files.files).toHaveLength(2);

    // get first table entry and check cols
    fileTable = view.findComponent(BTbody);
    tableRows = fileTable.findAll('tr');
    expect(tableRows).toHaveLength(2);
    tableCols = tableRows.at(0).findAll('td');
    expect(tableCols).toHaveLength(6);

    // find delete modal and check if is closed
    expect(view.findComponent(BModal).find('.modal').element.style.display).toEqual('none');

    // find delete action button and click
    deleteButton = tableCols.at(5).findAll('button').at(0);
    expect(deleteButton.html()).toContain('class="fa-solid fa-trash"');

    await waitModalShown(view, () => {
      deleteButton.trigger('click');
    });

    // open modal and confirm delete
    expect(view.findComponent(BModal).find('.modal').element.style.display).toEqual('block');

    const deleteFile2Request = mockAxios.request('/api/v1/rooms/123-456-789/files/2');

    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');

    // check for delete request and respond with 404, file is already deleted
    await deleteFile2Request.wait();
    await view.vm.$nextTick();
    expect(deleteFile2Request.config.method).toEqual('delete');
    await waitModalHidden(view, async () => {
      await deleteFile2Request.respondWith({
        status: 404,
        data: {
          message: 'No query results for model'
        }
      });
    });
    // check file missing error message and remove from file list
    expect(toastErrorSpy).toBeCalledTimes(1);
    expect(toastErrorSpy.mock.calls[0][0]).toBe('rooms.flash.file_gone');

    // find last file in the list, open modal and confirm delete
    fileTable = view.findComponent(BTbody);
    tableRows = fileTable.findAll('tr');
    tableCols = tableRows.at(0).findAll('td');
    deleteButton = tableCols.at(5).findAll('button').at(0);
    await waitModalShown(view, () => {
      deleteButton.trigger('click');
    });
    // open modal and confirm delete
    expect(view.findComponent(BModal).find('.modal').element.style.display).toEqual('block');

    const deleteFile1Request = mockAxios.request('/api/v1/rooms/123-456-789/files/1');

    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');

    // check for delete request and respond with 500
    await deleteFile1Request.wait();
    await view.vm.$nextTick();
    await waitModalHidden(view, async () => {
      await deleteFile1Request.respondWith({
        status: 500,
        data: {
          message: 'Internal server error'
        }
      });
    });

    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);
    view.destroy();
  });

  it('download file', async () => {
    const openStub = vi.spyOn(window, 'open').mockImplementation(() => {});
    const removeFile = vi.spyOn(FileComponent.methods, 'removeFile').mockImplementation(() => {});
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});
    const toastErrorSpy = vi.fn();

    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 200,
      data: {
        data: {
          files: [
            {
              id: 1,
              filename: 'File1.pdf',
              uploaded: '2020-09-21T07:08:00.000000Z'
            }
          ],
          default: 1
        }
      }
    });

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString(),
        toastError: toastErrorSpy
      },
      propsData: {
        room: exampleRoom
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // Test valid download
    let request = mockAxios.request('/api/v1/rooms/123-456-789/files/1');

    view.vm.downloadFile(view.vm.$data.files.files[0]);
    await request.wait();
    expect(request.config.headers['Access-Code']).toBeUndefined();
    expect(request.config.headers.Token).toBeUndefined();
    await request.respondWith({
      status: 200,
      data: {
        url: 'download-link.pdf'
      }
    });

    view.vm.$nextTick();
    expect(openStub).toBeCalledWith('download-link.pdf', '_blank');
    openStub.mockRestore();

    // Test 401 error, invalid code
    request = mockAxios.request('/api/v1/rooms/123-456-789/files/1').respondWith({
      status: 401,
      data: {
        message: 'invalid_code'
      }
    });

    view.vm.downloadFile(view.vm.$data.files.files[0]);

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.emitted('invalid-code').length).toBe(1);

    // Test 401, token invalid
    request = mockAxios.request('/api/v1/rooms/123-456-789/files/1').respondWith({
      status: 401,
      data: {
        message: 'invalid_token'
      }
    });

    view.vm.downloadFile(view.vm.$data.files.files[0]);

    await mockAxios.wait();
    await view.vm.$nextTick();

    view.vm.$nextTick();
    expect(view.emitted('invalid-token').length).toBe(1);

    // Test 403, require code
    request = mockAxios.request('/api/v1/rooms/123-456-789/files/1').respondWith({
      status: 403,
      data: {
        message: 'require_code'
      }
    });
    view.vm.downloadFile(view.vm.$data.files.files[0]);

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.emitted('invalid-code').length).toBe(2);

    // Test 403, file not available for download
    request = mockAxios.request('/api/v1/rooms/123-456-789/files/1').respondWith({
      status: 403,
      data: {
        message: 'This action is unauthorized.'
      }
    });

    view.vm.downloadFile(view.vm.$data.files.files[0]);

    await mockAxios.wait();
    await view.vm.$nextTick();

    view.vm.$nextTick();
    expect(toastErrorSpy).toBeCalledTimes(1);
    expect(toastErrorSpy).toBeCalledWith('rooms.flash.file_forbidden');
    expect(removeFile).toBeCalledWith({ id: 1, filename: 'File1.pdf', uploaded: '2020-09-21T07:08:00.000000Z' });

    // Test 404
    request = mockAxios.request('/api/v1/rooms/123-456-789/files/1').respondWith({
      status: 404,
      data: {
        message: 'No query results for model'
      }
    });
    view.vm.downloadFile(view.vm.$data.files.files[0]);

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(toastErrorSpy).toBeCalledTimes(2);
    expect(toastErrorSpy).lastCalledWith('rooms.flash.file_gone');
    expect(removeFile).toBeCalledWith(view.vm.$data.files.files[0]);

    // Test 500
    request = mockAxios.request('/api/v1/rooms/123-456-789/files/1').respondWith({
      status: 500,
      data: {
        message: 'Internal server error'
      }
    });
    view.vm.downloadFile(view.vm.$data.files.files[0]);
    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);
    view.destroy();
  });

  it('download file test request with access code', async () => {
    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 200,
      data: {
        data: {
          files: [
            {
              id: 1,
              filename: 'File1.pdf',
              uploaded: '2020-09-21T07:08:00.000000Z'
            }
          ],
          default: 1
        }
      }
    });

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        accessCode: 396856824,
        room: exampleRoom
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const request = mockAxios.request('/api/v1/rooms/123-456-789/files/1');

    // Test valid request header
    view.vm.downloadFile(view.vm.$data.files.files[0]);
    await request.wait();
    expect(request.config.headers['Access-Code']).toBe('396856824');
    expect(request.config.headers.Token).toBeUndefined();
    view.destroy();
  });

  it('download file test request with token', async () => {
    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 200,
      data: {
        data: {
          files: [
            {
              id: 1,
              filename: 'File1.pdf',
              uploaded: '2020-09-21T07:08:00.000000Z'
            }
          ],
          default: 1
        }
      }
    });

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR',
        room: exampleRoom
      },
      data () {
        return {
          files: {
            files: [
              {
                id: 1,
                filename: 'File1.pdf',
                uploaded: '2020-09-21T07:08:00.000000Z'
              }
            ]
          }
        };
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const request = mockAxios.request('/api/v1/rooms/123-456-789/files/1');

    // Test valid request header
    view.vm.downloadFile(view.vm.$data.files.files[0]);
    await request.wait();
    expect(request.config.headers['Access-Code']).toBeUndefined();
    expect(request.config.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    view.destroy();
  });

  it('change file setting', async () => {
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});
    const removeFile = vi.spyOn(FileComponent.methods, 'removeFile').mockImplementation(() => {});
    const toastErrorSpy = vi.fn();

    mockAxios.request('/api/v1/rooms/123-456-789/files').respondWith({
      status: 200,
      data: {
        data: {
          files: [
            {
              id: 1,
              filename: 'File1.pdf',
              download: false,
              use_in_meeting: true,
              default: true,
              uploaded: '2020-09-21T07:08:00.000000Z'
            }
          ],
          default: 1
        }
      }
    });

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString(),
        toastError: toastErrorSpy
      },
      propsData: {
        room: exampleRoom
      },
      data () {
        return {
          files: {
            files: [
              {
                id: 1,
                filename: 'File1.pdf',
                download: false,
                use_in_meeting: true,
                default: true,
                uploaded: '2020-09-21T07:08:00.000000Z'
              }
            ]
          }
        };
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    let request = mockAxios.request('/api/v1/rooms/123-456-789/files/1');

    view.vm.changeSettings(view.vm.$data.files.files[0], 'download', true);

    await request.wait();
    expect(request.config.method).toEqual('put');
    expect(request.config.data).toEqual('{"download":true}');
    await request.respondWith({
      status: 200,
      data: {
        data: {
          files: [
            { id: 1, filename: 'File1.pdf', download: true, use_in_meeting: true, default: false, uploaded: '2020-09-21T07:08:00.000000Z' }
          ],
          default: 1,
          file_mimes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png',
          file_size: 30
        }
      }
    });

    view.vm.$nextTick();
    expect(view.vm.$data.files.files[0].download).toBeTruthy();

    // Test 404

    request = mockAxios.request('/api/v1/rooms/123-456-789/files/1');

    view.vm.changeSettings(view.vm.$data.files.files[0]);
    await request.wait();
    await request.respondWith({
      status: 404,
      data: {
        message: 'No query results for model'
      }
    });

    view.vm.$nextTick();
    expect(toastErrorSpy).toBeCalledTimes(1);
    expect(toastErrorSpy).toBeCalledWith('rooms.flash.file_gone');
    expect(removeFile).toBeCalledWith(view.vm.$data.files.files[0]);

    // Test unknown error
    request = mockAxios.request('/api/v1/rooms/123-456-789/files/1');

    view.vm.changeSettings(view.vm.$data.files.files[0], 'download', true);
    await request.wait();
    await request.respondWith({
      status: 500,
      data: {
        message: 'Internal server error'
      }
    });
    view.vm.$nextTick();
    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);
    view.destroy();
  });
});
