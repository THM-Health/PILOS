import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue from 'bootstrap-vue';
import moxios from 'moxios';
import Clipboard from 'v-clipboard';
import Vuex from 'vuex';
import DeleteRoomComponent from '../../../../resources/js/components/Room/DeleteRoomComponent';
import sinon from 'sinon';
import Base from '../../../../resources/js/api/base';

const localVue = createLocalVue();

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

localVue.use(BootstrapVue);
localVue.use(Clipboard);
localVue.use(Vuex);

const exampleRoom = { id: 'gs4-6fb-kk8', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isGuest: false, isModerator: false, canStart: true, running: false, accessCode: 123456789, files: [] };

describe('Delete room', function () {
  beforeEach(function () {
    moxios.install();
  });
  afterEach(function () {
    moxios.uninstall();
  });

  it('default render', function () {
    const component = mount(DeleteRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom,
        buttonClass: 'demoClass'
      },
      attachTo: createContainer()
    });

    const deleteButton = component.findComponent({ ref: 'deleteButton' });
    expect(deleteButton.exists()).toBe(true);
    expect(deleteButton.attributes('disabled')).not.toBe('disabled');
    expect(deleteButton.classes()).toContain('demoClass');
  });

  it('disable button', function () {
    const component = mount(DeleteRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom,
        disabled: true
      },
      attachTo: createContainer()
    });

    const deleteButton = component.findComponent({ ref: 'deleteButton' });
    expect(deleteButton.exists()).toBe(true);
    expect(deleteButton.attributes('disabled')).toBe('disabled');
  });

  it('successfull delete', function (done) {
    const component = mount(DeleteRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom,
        disabled: true
      },
      attachTo: createContainer()
    });

    const bvModalEvt = {
      preventDefault () {
        return sinon.spy();
      }
    };

    component.vm.deleteRoom(bvModalEvt);
    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      expect(request.config.method).toMatch('delete');
      expect(request.config.url).toContain(exampleRoom.id);
      request.respondWith({
        status: 204
      })
        .then(function () {
          component.vm.$nextTick();
          expect(component.emitted().roomDeleted).toBeTruthy();
          done();
        });
    });
  });

  it('failed delete room not found', function (done) {
    const flashMessageSpy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(flashMessageSpy);

    const component = mount(DeleteRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom,
        disabled: true
      },
      attachTo: createContainer(),
      Base
    });

    const bvModalEvt = {
      preventDefault () {
        return sinon.spy();
      }
    };

    component.vm.deleteRoom(bvModalEvt);
    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      expect(request.config.method).toMatch('delete');
      expect(request.config.url).toContain(exampleRoom.id);
      request.respondWith({
        status: 404
      })
        .then(function () {
          component.vm.$nextTick();
          expect(flashMessageSpy.calledOnce).toBeTruthy();
          expect(flashMessageSpy.getCall(0).args[0].response.status).toBe(404);
          Base.error.restore();
          done();
        });
    });
  });
});
