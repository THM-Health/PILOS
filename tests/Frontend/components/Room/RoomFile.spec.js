import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BButton, BModal, BTbody } from 'bootstrap-vue';
import moxios from 'moxios';
import FileComponent from '../../../../resources/js/components/Room/FileComponent.vue';
import Clipboard from 'v-clipboard';
import Vuex from 'vuex';
import sinon from 'sinon';
import Base from '../../../../resources/js/api/base';
import PermissionService from '../../../../resources/js/services/PermissionService';

const localVue = createLocalVue();

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

localVue.use(BootstrapVue);
localVue.use(Clipboard);
localVue.use(Vuex);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], modelName: 'User', room_limit: -1 };
const ownerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: false };
const exampleRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: false };

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

describe('RoomFile', function () {
  beforeEach(function () {
    moxios.install();
  });
  afterEach(function () {
    moxios.uninstall();
  });

  it('load files', function (done) {
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

    moxios.wait(async () => {
      await view.vm.$nextTick();
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/files');
      request.respondWith({
        status: 200,
        response: {
          data: {
            files: [
              { id: 1, filename: 'File1.pdf', download: true, useinmeeting: false, default: false, uploaded: '21.09.2020 07:08' },
              { id: 2, filename: 'File2.pdf', download: true, useinmeeting: true, default: true, uploaded: '21.09.2020 07:08' },
              { id: 3, filename: 'File3.pdf', download: false, useinmeeting: false, default: false, uploaded: '21.09.2020 07:09' }
            ],
            default: 2
          }
        }
      })
        .then(function () {
          expect(view.vm.$data.files.files).toHaveLength(3);
          view.destroy();
          done();
        });
    });
  });

  it('hide table fields', function () {
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
    const fields = view.vm.filefields.map(a => a.key);
    expect(fields).toContain('filename');
    expect(fields).toContain('uploaded');
    expect(fields).toContain('actions');
    expect(fields).not.toContain('downloadable');
    expect(fields).not.toContain('useInNextMeeting');
    expect(fields).not.toContain('default');
  });

  it('show owner all table fields', function () {
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
    const fields = view.vm.filefields.map(a => a.key);
    expect(fields).toContain('filename');
    expect(fields).toContain('uploaded');
    expect(fields).toContain('actions');
    expect(fields).toContain('download');
    expect(fields).toContain('useinmeeting');
    expect(fields).toContain('default');
  });

  it('error emitted on files load', function (done) {
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

    moxios.wait(async () => {
      await view.vm.$nextTick();
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/files');
      request.respondWith({
        status: 403,
        response: {
          data: {
            message: 'require_code'
          }
        }
      })
        .then(function () {
          expect(view.emitted().error).toBeTruthy();
          expect(view.emitted().error[0][0].response.status).toBe(403);
          view.destroy();
          done();
        });
    });
  });

  it('remove file', function (done) {
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

    moxios.wait(async () => {
      await view.vm.$nextTick();
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/files');
      request.respondWith({
        status: 200,
        response: {
          data: {
            files: [
              {
                id: 1,
                filename: 'File1.pdf',
                download: true,
                useinmeeting: false,
                default: false,
                uploaded: '21.09.2020 07:08'
              },
              {
                id: 2,
                filename: 'File2.pdf',
                download: true,
                useinmeeting: true,
                default: true,
                uploaded: '21.09.2020 07:08'
              },
              {
                id: 3,
                filename: 'File3.pdf',
                download: false,
                useinmeeting: false,
                default: false,
                uploaded: '21.09.2020 07:09'
              }
            ],
            default: 2
          }
        }
      }).then(function () {
        expect(view.vm.$data.files.files).toHaveLength(3);
        view.vm.removeFile(view.vm.$data.files.files[0]);
        expect(view.vm.$data.files.files).toHaveLength(2);
        view.destroy();
        done();
      });
    });
  });

  it('delete file', function (done) {
    PermissionService.setCurrentUser(exampleUser);
    const baseError = sinon.stub(Base, 'error');
    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      error (param) {
        flashMessageSpy(param);
      }
    };

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
    moxios.wait(async () => {
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
                useinmeeting: false,
                default: false,
                uploaded: '21.09.2020 07:08'
              },
              {
                id: 2,
                filename: 'File2.pdf',
                download: true,
                useinmeeting: true,
                default: true,
                uploaded: '21.09.2020 07:09'
              },
              {
                id: 3,
                filename: 'File3.pdf',
                download: false,
                useinmeeting: false,
                default: false,
                uploaded: '21.09.2020 07:10'
              }
            ],
            default: 2
          }
        }
      });

      // check if all files found
      expect(view.vm.$data.files.files).toHaveLength(3);

      // get first table entry and check cols
      const fileTable = view.findComponent(BTbody);
      const tableRows = fileTable.findAll('tr');
      expect(tableRows).toHaveLength(3);
      const tableCols = tableRows.at(0).findAll('td');
      expect(tableCols).toHaveLength(6);

      // find delete action button and click
      const deleteButton = tableCols.at(5).findAll('button').at(0);
      expect(deleteButton.html()).toContain('<i class="fas fa-trash"></i>');

      view.vm.$nextTick()
        .then(() => {
          expect(view.findComponent(BModal).find('.modal').element.style.display).toEqual('none');
          deleteButton.trigger('click');
          return new Promise((resolve, reject) => {
            view.vm.$root.$once('bv::modal::shown', () => resolve());
          });
        })
        .then(() => {
        // open modal and confirm delete
          expect(view.findComponent(BModal).find('.modal').element.style.display).toEqual('block');
          view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');

          // check for delete requests
          moxios.wait(async () => {
            const request = moxios.requests.mostRecent();
            expect(request.config.method).toEqual('delete');
            expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/files/3');
            await request.respondWith({
              status: 200,
              response: {
                data: {
                  files: [
                    {
                      id: 1,
                      filename: 'File1.pdf',
                      download: true,
                      useinmeeting: false,
                      default: false,
                      uploaded: '21.09.2020 07:08'
                    },
                    {
                      id: 2,
                      filename: 'File2.pdf',
                      download: true,
                      useinmeeting: true,
                      default: true,
                      uploaded: '21.09.2020 07:09'
                    }
                  ],
                  default: 2
                }
              }
            });
          });

          return new Promise((resolve, reject) => {
            view.vm.$root.$once('bv::modal::hidden', () => resolve());
          });
        })
        .then(() => {
          // check if file list was updated
          expect(view.vm.$data.files.files).toHaveLength(2);

          // get first table entry and check cols
          const fileTable = view.findComponent(BTbody);
          const tableRows = fileTable.findAll('tr');
          expect(tableRows).toHaveLength(2);
          const tableCols = tableRows.at(0).findAll('td');
          expect(tableCols).toHaveLength(6);

          // find delete modal and check if is closed
          expect(view.findComponent(BModal).find('.modal').element.style.display).toEqual('none');

          // find delete action button and click
          const deleteButton = tableCols.at(5).findAll('button').at(0);
          expect(deleteButton.html()).toContain('<i class="fas fa-trash"></i>');
          deleteButton.trigger('click');

          return new Promise((resolve, reject) => {
            view.vm.$root.$once('bv::modal::shown', () => resolve());
          });
        })
        .then(() => {
          // open modal and confirm delete
          expect(view.findComponent(BModal).find('.modal').element.style.display).toEqual('block');
          view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');

          // check for delete request and respond with 404, file is already deleted
          moxios.wait(async () => {
            await view.vm.$nextTick();
            const request = moxios.requests.mostRecent();
            expect(request.config.method).toEqual('delete');
            expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/files/2');
            await request.respondWith({
              status: 404,
              response: {
                message: 'No query results for model'
              }
            });
          });

          return new Promise((resolve, reject) => {
            view.vm.$root.$once('bv::modal::hidden', () => resolve());
          });
        })
        .then(() => {
          // check file missing error message and remove from file list
          expect(flashMessageSpy.calledOnce).toBeTruthy();
          expect(flashMessageSpy.getCall(0).args[0]).toBe('rooms.flash.fileGone');

          // find last file in the list, open modal and confirm delete
          const fileTable = view.findComponent(BTbody);
          const tableRows = fileTable.findAll('tr');
          const tableCols = tableRows.at(0).findAll('td');
          const deleteButton = tableCols.at(5).findAll('button').at(0);
          deleteButton.trigger('click');

          return new Promise((resolve, reject) => {
            view.vm.$root.$once('bv::modal::shown', () => resolve());
          });
        })
        .then(() => {
          // open modal and confirm delete
          expect(view.findComponent(BModal).find('.modal').element.style.display).toEqual('block');
          view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');

          // check for delete request and respond with 500
          moxios.wait(async () => {
            await view.vm.$nextTick();
            await moxios.requests.mostRecent().respondWith({
              status: 500,
              response: {
                message: 'Internal server error'
              }
            });
          });

          return new Promise((resolve, reject) => {
            view.vm.$root.$once('bv::modal::hidden', () => resolve());
          });
        })
        .then(() => {
          expect(baseError.calledOnce).toBeTruthy();
          expect(baseError.getCall(0).args[0].response.status).toEqual(500);

          baseError.restore();
          done();
        });
    });
  });

  it('download file', function (done) {
    const openStub = sinon.stub(window, 'open');
    const removeFile = sinon.stub(FileComponent.methods, 'removeFile');
    const baseError = sinon.stub(Base, 'error');
    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      error (param) {
        flashMessageSpy(param);
      }
    };

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
                uploaded: '21.09.2020 07:08'
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
    moxios.wait(async () => {
      await view.vm.$nextTick();
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/files/1');
      request.respondWith({
        status: 200,
        response: {
          url: 'download-link.pdf'
        }
      })
        .then(function () {
          view.vm.$nextTick();
          expect(openStub.calledWith('download-link.pdf', '_blank')).toBeTruthy();
          window.open.restore();

          // Test 401 error, invalid code
          view.vm.downloadFile(view.vm.$data.files.files[0]);
          moxios.wait(async () => {
            await view.vm.$nextTick();
            moxios.requests.mostRecent().respondWith({
              status: 401,
              response: {
                message: 'invalid_code'
              }
            })
              .then(function () {
                expect(view.emitted().error).toBeTruthy();
                expect(view.emitted().error[0][0].response.status).toBe(401);

                // Test 403, require code
                view.vm.downloadFile(view.vm.$data.files.files[0]);
                moxios.wait(async () => {
                  await view.vm.$nextTick();
                  moxios.requests.mostRecent().respondWith({
                    status: 403,
                    response: {
                      message: 'require_code'
                    }
                  })
                    .then(function () {
                      expect(view.emitted().error).toBeTruthy();
                      expect(view.emitted().error[1][0].response.status).toBe(403);

                      // Test 403
                      view.vm.downloadFile(view.vm.$data.files.files[0]);
                      moxios.wait(async () => {
                        await view.vm.$nextTick();
                        moxios.requests.mostRecent().respondWith({
                          status: 403,
                          response: {
                            message: 'This action is unauthorized.'
                          }
                        })
                          .then(function () {
                            view.vm.$nextTick();
                            expect(flashMessageSpy.calledOnce).toBeTruthy();
                            expect(flashMessageSpy.getCall(0).args[0]).toBe('rooms.flash.fileForbidden');
                            expect(removeFile.calledWith({ id: 1, filename: 'File1.pdf', uploaded: '21.09.2020 07:08' })).toBeTruthy();

                            // Test 404
                            view.vm.downloadFile(view.vm.$data.files.files[0]);
                            moxios.wait(async () => {
                              await view.vm.$nextTick();
                              moxios.requests.mostRecent().respondWith({
                                status: 404,
                                response: {
                                  message: 'No query results for model'
                                }
                              })
                                .then(function () {
                                  view.vm.$nextTick();
                                  expect(flashMessageSpy.calledTwice).toBeTruthy();
                                  expect(flashMessageSpy.getCall(1).args[0]).toBe('rooms.flash.fileGone');
                                  expect(removeFile.calledWith(view.vm.$data.files.files[0])).toBeTruthy();

                                  // Test 500
                                  view.vm.downloadFile(view.vm.$data.files.files[0]);
                                  moxios.wait(async () => {
                                    await view.vm.$nextTick();
                                    moxios.requests.mostRecent().respondWith({
                                      status: 500,
                                      response: {
                                        message: 'Internal server error'
                                      }
                                    })
                                      .then(function () {
                                        view.vm.$nextTick();
                                        expect(baseError.calledOnce).toBeTruthy();
                                        expect(baseError.getCall(0).args[0].response.status).toEqual(500);
                                        Base.error.restore();
                                        FileComponent.methods.removeFile.restore();
                                        view.destroy();
                                        done();
                                      });
                                  });
                                });
                            });
                          });
                      });
                    });
                });
              });
          });
        });
    });
  });

  it('change file setting', function (done) {
    const baseError = sinon.stub(Base, 'error');
    const removeFile = sinon.stub(FileComponent.methods, 'removeFile');
    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      error (param) {
        flashMessageSpy(param);
      }
    };

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
                useinmeeting: true,
                default: true,
                uploaded: '21.09.2020 07:08'
              }
            ]
          }
        };
      },
      store,
      attachTo: createContainer()
    });

    view.vm.changeSettings(view.vm.$data.files.files[0], 'download', true);
    moxios.wait(async () => {
      await view.vm.$nextTick();
      const request = moxios.requests.mostRecent();
      expect(request.config.method).toEqual('put');
      expect(request.config.data).toEqual('{"download":true}');
      request.respondWith({
        status: 200,
        response: {
          data: {
            files: [
              { id: 1, filename: 'File1.pdf', download: true, useinmeeting: true, default: false, uploaded: '21.09.2020 07:08' }
            ],
            default: 1,
            file_mimes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png',
            file_size: 30
          }
        }
      })
        .then(function () {
          view.vm.$nextTick();
          expect(view.vm.$data.files.files[0].download).toBeTruthy();

          // Test 404
          view.vm.changeSettings(view.vm.$data.files.files[0]);
          moxios.wait(async () => {
            await view.vm.$nextTick();
            moxios.requests.mostRecent().respondWith({
              status: 404,
              response: {
                message: 'No query results for model'
              }
            })
              .then(function () {
                view.vm.$nextTick();
                expect(flashMessageSpy.calledOnce).toBeTruthy();
                expect(flashMessageSpy.getCall(0).args[0]).toBe('rooms.flash.fileGone');
                expect(removeFile.calledWith(view.vm.$data.files.files[0])).toBeTruthy();

                // Test unknown error
                view.vm.changeSettings(view.vm.$data.files.files[0], 'download', true);
                moxios.wait(async () => {
                  await view.vm.$nextTick();
                  moxios.requests.mostRecent().respondWith({
                    status: 500,
                    response: {
                      message: 'Internal server error'
                    }
                  })
                    .then(function () {
                      view.vm.$nextTick();
                      expect(baseError.calledOnce).toBeTruthy();
                      expect(baseError.getCall(0).args[0].response.status).toEqual(500);
                      Base.error.restore();
                      FileComponent.methods.removeFile.restore();
                      view.destroy();
                      done();
                    });
                });
              });
          });
        });
    });
  });
});
