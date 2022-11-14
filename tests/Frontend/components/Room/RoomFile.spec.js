import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BButton, BFormFile, BFormInvalidFeedback, BModal, BTbody } from 'bootstrap-vue';
import moxios from 'moxios';
import FileComponent from '../../../../resources/js/components/Room/FileComponent.vue';
import Clipboard from 'v-clipboard';
import Vuex from 'vuex';
import Base from '../../../../resources/js/api/base';
import PermissionService from '../../../../resources/js/services/PermissionService';
import _ from 'lodash';
import { waitModalHidden, waitModalShown, waitMoxios, createContainer } from '../../helper';

const localVue = createLocalVue();

localVue.use(BootstrapVue);
localVue.use(Clipboard);
localVue.use(Vuex);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };
const ownerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false };
const coOwnerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 2, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: true, is_co_owner: true, is_moderator: false, can_start: false, running: false };
const exampleRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false };

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      actions: {
        getCurrentUser () {}
      },
      state: {
        currentUser: exampleUser
      },
      getters: {
        isAuthenticated: () => true,
        settings: () => (setting) => null
      }
    }
  },
  state: {
    loadingCounter: 0
  }
});

describe('RoomFile', () => {
  beforeEach(() => {
    moxios.install();
  });
  afterEach(() => {
    moxios.uninstall();
  });

  it('load files', async () => {
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
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    const request = moxios.requests.mostRecent();
    expect(request.config.headers['Access-Code']).toBeUndefined();
    expect(request.config.headers.Token).toBeUndefined();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/files');
    await request.respondWith({
      status: 200,
      response: {
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
    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        accessCode: '396856824',
        room: exampleRoom,
        showTitle: true
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();

    await view.vm.$nextTick();
    const request = moxios.requests.mostRecent();
    expect(request.config.headers['Access-Code']).toBe('396856824');
    expect(request.config.headers.Token).toBeUndefined();
    view.destroy();
  });

  it('load files with token', async () => {
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
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    const request = moxios.requests.mostRecent();
    expect(request.config.headers['Access-Code']).toBeUndefined();
    expect(request.config.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    view.destroy();
  });

  it('hide table fields and upload', async () => {
    PermissionService.setCurrentUser(exampleUser);

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom,
        showTitle: true
      },
      store,
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
    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: ownerRoom,
        showTitle: true
      },
      store,
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
    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: coOwnerRoom,
        showTitle: true
      },
      store,
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

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom,
        showTitle: true
      },
      store,
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

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom,
        showTitle: true
      },
      store,
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
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    let request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/files');
    await request.respondWith({
      status: 200,
      response: {
        data: {
          files: [],
          default: null
        }
      }
    });
    await view.vm.$nextTick();

    expect(view.vm.$data.files.files).toHaveLength(0);
    expect(view.findComponent(BFormFile).exists()).toBeTruthy();
    const file = new window.File(['foo'], 'foo.txt', {
      type: 'text/plain',
      lastModified: Date.now()
    });

    view.vm.uploadFile({ target: { files: [file] } });

    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.headers['Content-Type']).toBe('multipart/form-data');
    expect(request.config.url).toBe('/api/v1/rooms/123-456-789/files');
    expect(request.config.method).toBe('post');
    expect(request.config.data.get('file')).toBe(file);

    await request.respondWith({
      status: 200,
      response: {
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
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    let request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/files');
    await request.respondWith({
      status: 200,
      response: {
        data: {
          files: [],
          default: null
        }
      }
    });
    await view.vm.$nextTick();

    const file = new window.File(['foo'], 'foo.txt', {
      type: 'text/plain',
      lastModified: Date.now()
    });

    expect(view.findComponent(BFormInvalidFeedback).text()).toBe('');
    view.vm.uploadFile({ target: { files: [file] } });

    await waitMoxios();
    request = moxios.requests.mostRecent();
    await request.respondWith({
      status: 413
    });

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
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    let request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/files');
    await request.respondWith({
      status: 200,
      response: {
        data: {
          files: [],
          default: null
        }
      }
    });
    await view.vm.$nextTick();

    const file = new window.File(['foo'], 'foo.txt', {
      type: 'text/plain',
      lastModified: Date.now()
    });

    expect(view.findComponent(BFormInvalidFeedback).text()).toBe('');
    view.vm.uploadFile({ target: { files: [file] } });

    await waitMoxios();
    request = moxios.requests.mostRecent();
    await request.respondWith({
      status: 422,
      response: {
        message: 'The given data was invalid.',
        errors: {
          file: ['The File must be a file of type: pdf, doc.']
        }
      }
    });

    await view.vm.$nextTick();

    expect(view.findComponent(BFormInvalidFeedback).text()).toBe('The File must be a file of type: pdf, doc.');
    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('upload file other errors', async () => {
    const oldUser = PermissionService.currentUser;
    const baseError = jest.spyOn(Base, 'error').mockImplementation();
    const newUser = _.clone(exampleUser);
    newUser.permissions = ['rooms.manage'];
    PermissionService.setCurrentUser(newUser);

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
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    let request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/files');
    await request.respondWith({
      status: 200,
      response: {
        data: {
          files: [],
          default: null
        }
      }
    });
    await view.vm.$nextTick();

    const file = new window.File(['foo'], 'foo.txt', {
      type: 'text/plain',
      lastModified: Date.now()
    });

    view.vm.uploadFile({ target: { files: [file] } });

    await waitMoxios();
    request = moxios.requests.mostRecent();
    await request.respondWith({
      status: 500,
      response: {
        message: 'Internal server error'
      }
    });

    await view.vm.$nextTick();

    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);
    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('error emitted on files load', async () => {
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
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    const request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/files');
    await request.respondWith({
      status: 403,
      response: {
        data: {
          message: 'require_code'
        }
      }
    });
    expect(view.emitted().error).toBeTruthy();
    expect(view.emitted().error[0][0].response.status).toBe(403);
    view.destroy();
  });

  it('remove file', async () => {
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
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    const request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/files');
    await request.respondWith({
      status: 200,
      response: {
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
    expect(view.vm.$data.files.files).toHaveLength(3);
    view.vm.removeFile(view.vm.$data.files.files[0]);
    expect(view.vm.$data.files.files).toHaveLength(2);
    view.destroy();
  });

  it('delete file', async () => {
    PermissionService.setCurrentUser(exampleUser);
    const baseError = jest.spyOn(Base, 'error').mockImplementation();
    const flashMessageSpy = jest.fn();
    const flashMessage = { error: flashMessageSpy };

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString(),
        flashMessage: flashMessage
      },
      propsData: {
        room: ownerRoom,
        showTitle: true,
        modalStatic: true
      },
      store,
      attachTo: createContainer(),
      stubs: {
        transition: false
      }
    });

    // load files
    await waitMoxios();
    let request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/files');
    await request.respondWith({
      status: 200,
      response: {
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
            },
            {
              id: 3,
              filename: 'File3.pdf',
              download: false,
              use_in_meeting: false,
              default: false,
              uploaded: '2020-09-21T07:10:00.000000Z'
            }
          ],
          default: 2
        }
      }
    });

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
    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');

    // check for delete requests
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('delete');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/files/3');
    await waitModalHidden(view, async () => {
      await request.respondWith({
        status: 200,
        response: {
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
    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');

    // check for delete request and respond with 404, file is already deleted
    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('delete');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/files/2');
    await waitModalHidden(view, async () => {
      await request.respondWith({
        status: 404,
        response: {
          message: 'No query results for model'
        }
      });
    });
    // check file missing error message and remove from file list
    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy.mock.calls[0][0]).toBe('rooms.flash.file_gone');

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
    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');

    // check for delete request and respond with 500
    await waitMoxios();
    await view.vm.$nextTick();
    await waitModalHidden(view, async () => {
      await moxios.requests.mostRecent().respondWith({
        status: 500,
        response: {
          message: 'Internal server error'
        }
      });
    });

    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);
    view.destroy();
  });

  it('download file', async () => {
    const openStub = jest.spyOn(window, 'open').mockImplementation();
    const removeFile = jest.spyOn(FileComponent.methods, 'removeFile').mockImplementation();
    const baseError = jest.spyOn(Base, 'error').mockImplementation();
    const flashMessageSpy = jest.fn();
    const flashMessage = { error: flashMessageSpy };

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString(),
        flashMessage: flashMessage
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
                uploaded: '2020-09-21T07:08:00.000000Z'
              }
            ]
          }
        };
      },
      store,
      attachTo: createContainer()
    });
    // Test valid download
    view.vm.downloadFile(view.vm.$data.files.files[0]);
    await waitMoxios();
    await view.vm.$nextTick();
    const request = moxios.requests.mostRecent();
    expect(request.config.headers['Access-Code']).toBeUndefined();
    expect(request.config.headers.Token).toBeUndefined();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/files/1');
    await request.respondWith({
      status: 200,
      response: {
        url: 'download-link.pdf'
      }
    });

    view.vm.$nextTick();
    expect(openStub).toBeCalledWith('download-link.pdf', '_blank');
    openStub.mockRestore();

    // Test 401 error, invalid code
    view.vm.downloadFile(view.vm.$data.files.files[0]);
    await waitMoxios();
    await view.vm.$nextTick();
    await moxios.requests.mostRecent().respondWith({
      status: 401,
      response: {
        message: 'invalid_code'
      }
    });

    expect(view.emitted().error.length).toBe(1);
    expect(view.emitted().error[0][0].response.status).toBe(401);

    // Test 401, token invalid
    view.vm.downloadFile(view.vm.$data.files.files[0]);
    await waitMoxios();
    await view.vm.$nextTick();
    await moxios.requests.mostRecent().respondWith({
      status: 401,
      response: {
        message: 'invalid_token'
      }
    });

    view.vm.$nextTick();
    expect(view.emitted().error.length).toBe(2);
    expect(view.emitted().error[1][0].response.status).toBe(401);

    // Test 403, require code
    view.vm.downloadFile(view.vm.$data.files.files[0]);
    await waitMoxios();
    await view.vm.$nextTick();
    await moxios.requests.mostRecent().respondWith({
      status: 403,
      response: {
        message: 'require_code'
      }
    });

    expect(view.emitted().error.length).toBe(3);
    expect(view.emitted().error[2][0].response.status).toBe(403);

    // Test 403, file not available for download
    view.vm.downloadFile(view.vm.$data.files.files[0]);
    await waitMoxios();
    await view.vm.$nextTick();
    await moxios.requests.mostRecent().respondWith({
      status: 403,
      response: {
        message: 'This action is unauthorized.'
      }
    });

    view.vm.$nextTick();
    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy).toBeCalledWith('rooms.flash.file_forbidden');
    expect(removeFile).toBeCalledWith({ id: 1, filename: 'File1.pdf', uploaded: '2020-09-21T07:08:00.000000Z' });

    // Test 404
    view.vm.downloadFile(view.vm.$data.files.files[0]);
    await waitMoxios();
    await view.vm.$nextTick();
    await moxios.requests.mostRecent().respondWith({
      status: 404,
      response: {
        message: 'No query results for model'
      }
    });
    view.vm.$nextTick();
    expect(flashMessageSpy).toBeCalledTimes(2);
    expect(flashMessageSpy).lastCalledWith('rooms.flash.file_gone');
    expect(removeFile).toBeCalledWith(view.vm.$data.files.files[0]);

    // Test 500
    view.vm.downloadFile(view.vm.$data.files.files[0]);
    await waitMoxios();
    await view.vm.$nextTick();
    await moxios.requests.mostRecent().respondWith({
      status: 500,
      response: {
        message: 'Internal server error'
      }
    });

    view.vm.$nextTick();
    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);
    view.destroy();
  });

  it('download file test request with access code', async () => {
    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        accessCode: '396856824',
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
      store,
      attachTo: createContainer()
    });
    // Test valid request header
    view.vm.downloadFile(view.vm.$data.files.files[0]);
    await waitMoxios();
    await view.vm.$nextTick();
    const request = moxios.requests.mostRecent();
    expect(request.config.headers['Access-Code']).toBe('396856824');
    expect(request.config.headers.Token).toBeUndefined();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/files/1');
    view.destroy();
  });

  it('download file test request with token', async () => {
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
      store,
      attachTo: createContainer()
    });
    // Test valid request header
    view.vm.downloadFile(view.vm.$data.files.files[0]);
    await waitMoxios();
    await view.vm.$nextTick();
    const request = moxios.requests.mostRecent();
    expect(request.config.headers['Access-Code']).toBeUndefined();
    expect(request.config.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/files/1');
    view.destroy();
  });

  it('change file setting', async () => {
    const baseError = jest.spyOn(Base, 'error').mockImplementation();
    const removeFile = jest.spyOn(FileComponent.methods, 'removeFile').mockImplementation();
    const flashMessageSpy = jest.fn();
    const flashMessage = { error: flashMessageSpy };

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString(),
        flashMessage: flashMessage
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
      store,
      attachTo: createContainer()
    });

    view.vm.changeSettings(view.vm.$data.files.files[0], 'download', true);
    await waitMoxios();
    await view.vm.$nextTick();
    const request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('put');
    expect(request.config.data).toEqual('{"download":true}');
    await request.respondWith({
      status: 200,
      response: {
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
    view.vm.changeSettings(view.vm.$data.files.files[0]);
    await waitMoxios();
    await view.vm.$nextTick();
    await moxios.requests.mostRecent().respondWith({
      status: 404,
      response: {
        message: 'No query results for model'
      }
    });

    view.vm.$nextTick();
    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy).toBeCalledWith('rooms.flash.file_gone');
    expect(removeFile).toBeCalledWith(view.vm.$data.files.files[0]);

    // Test unknown error
    view.vm.changeSettings(view.vm.$data.files.files[0], 'download', true);
    await waitMoxios();
    await view.vm.$nextTick();
    await moxios.requests.mostRecent().respondWith({
      status: 500,
      response: {
        message: 'Internal server error'
      }
    });
    view.vm.$nextTick();
    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);
    view.destroy();
  });
});
