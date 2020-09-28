import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue from 'bootstrap-vue';
import moxios from 'moxios';
import FileComponent from '../../../../resources/js/components/Room/FileComponent.vue';
import Clipboard from 'v-clipboard';
import Vuex from 'vuex';

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

function overrideStub (url, response) {
  const l = moxios.stubs.count();
  for (let i = 0; i < l; i++) {
    const stub = moxios.stubs.at(i);
    if (stub.url === url) {
      const oldResponse = stub.response;
      const restoreFunc = () => { stub.response = oldResponse; };

      stub.response = response;
      return restoreFunc;
    }
  }
}

describe('RoomFile', function () {
  beforeEach(function () {
    moxios.install();
  });
  afterEach(function () {
    moxios.uninstall();
  });

  it('guest forbidden', function (done) {
    const view = mount(FileComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        roomId: '123-456-789',
        showTitle: true,
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      let request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/files');
      request.respondWith({
        status: 200,
        response: {
          "data":{
            "files":[
              {"id":1,"filename":"File1.pdf","download":true,"useinmeeting":false,"default":false,"uploaded":"21.09.2020 07:08"},
              {"id":2,"filename":"File2.pdf","download":true,"useinmeeting":true,"default":true,"uploaded":"21.09.2020 07:08"},
              {"id":3,"filename":"File3.pdf","download":false,"useinmeeting":false,"default":false,"uploaded":"21.09.2020 07:09"}
              ],
            "default":2,
            "file_mimes":"pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png",
            "file_size":30
          }
        }
      })
        .then(function () {
          expect(view.vm.$data.files.files).toHaveLength(3);
          done();
        });

    });


  });
});
