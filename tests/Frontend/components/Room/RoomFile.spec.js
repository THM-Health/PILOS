import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue from 'bootstrap-vue';
import moxios from 'moxios';
import FileComponent from '../../../../resources/js/components/Room/FileComponent.vue';
import Clipboard from 'v-clipboard';
import Vuex from 'vuex';
import sinon from 'sinon';

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
        $t: (key) => key
      },
      propsData: {
        roomId: '123-456-789',
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
            default: 2,
            file_mimes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png',
            file_size: 30
          }
        }
      })
        .then(function () {
          expect(view.vm.$data.files.files).toHaveLength(3);
          done();
        });
    });
  });

  it('hide table fields', function () {
    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        roomId: '123-456-789',
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
    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        roomId: '123-456-789',
        showTitle: true,
        isOwner: true
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
        $t: (key) => key
      },
      propsData: {
        roomId: '123-456-789',
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
          done();
        });
    });
  });

  it('remove file', function () {
    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      data () {
        return {
          files: {
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
            default: 2,
            file_mimes: 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png',
            file_size: 30
          }
        };
      },
      store,
      attachTo: createContainer()
    });
    expect(view.vm.$data.files.files).toHaveLength(3);
    view.vm.removeFile(view.vm.$data.files.files[0]);
    expect(view.vm.$data.files.files).toHaveLength(2);
  });

  it('download file', function (done) {
    const openStub = sinon.stub(window, 'open');

    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        roomId: '123-456-789'
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
          done();
        });
    });
  });
});
