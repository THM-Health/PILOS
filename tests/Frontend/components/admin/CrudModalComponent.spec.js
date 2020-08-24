import { createLocalVue, mount } from '@vue/test-utils';
import CrudModalComponent from '../../../../resources/js/components/Admin/users/CrudModalComponent';
import BootstrapVue, {} from 'bootstrap-vue';
import moxios from 'moxios';

const localVue = createLocalVue();
localVue.use(BootstrapVue);

describe('CrudModalComponent', function () {
  let wrapper;

  beforeEach(function () {
    wrapper = mount(CrudModalComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        modalId: 'crud-modal',
        modalType: 'create',
        crudUser: {
          id: 1,
          firstname: 'max',
          lastname: 'mustermann',
          email: 'max@mustermann.com',
          password: 'secret',
          username: 'mstt'
        }
      }
    });

    moxios.install();
  });

  afterEach(function () {
    moxios.uninstall();
  });

  it('shows different type of modal based on modalType props', async function () {
    // Create Modal at the beginning
    await wrapper.setProps({ modalType: 'create' });

    const crudModal = wrapper.find('#crud-modal');
    expect(crudModal.exists()).toBe(true);

    let deleteDiv = wrapper.find('#user-delete');
    let createUpdateDiv = wrapper.find('#user-create-update');

    expect(deleteDiv.exists()).toBe(false);
    expect(createUpdateDiv.exists()).toBe(true);

    // Delete Modal
    await wrapper.setProps({ modalType: 'delete' });

    createUpdateDiv = wrapper.find('#user-create-update');
    deleteDiv = wrapper.find('#user-delete');
    expect(deleteDiv.exists()).toBe(true);
    expect(createUpdateDiv.exists()).toBe(false);

    // Update Modal
    await wrapper.setProps({ modalType: 'update' });

    createUpdateDiv = wrapper.find('#user-create-update');
    deleteDiv = wrapper.find('#user-delete');
    expect(deleteDiv.exists()).toBe(false);
    expect(createUpdateDiv.exists()).toBe(true);
  });

  it('resets crudUser variables when resetModal is called', function () {
    expect(wrapper.vm.crudUser.id).toBe(1);
    expect(wrapper.vm.crudUser.firstname).toBe('max');
    expect(wrapper.vm.crudUser.lastname).toBe('mustermann');
    expect(wrapper.vm.crudUser.password).toBe('secret');
    expect(wrapper.vm.crudUser.username).toBe('mstt');

    wrapper.vm.resetModal();

    expect(wrapper.vm.crudUser.id).toBe(null);
    expect(wrapper.vm.crudUser.firstname).toBe(null);
    expect(wrapper.vm.crudUser.lastname).toBe(null);
    expect(wrapper.vm.crudUser.password).toBe(null);
    expect(wrapper.vm.crudUser.username).toBe(null);
  });

  it('emits (crud) when create user method is called', function (done) {
    // Nothing emitted at the beginning
    expect(wrapper.emitted().crud).toBeUndefined();

    // Call create user axios function
    wrapper.vm.createUser(wrapper.vm.crudUser);

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 201,
        response: 'Mock create success'
      }).then(function () {
        expect(wrapper.emitted().crud).toBeTruthy();
        done();
      });
    });
  });

  it('emits (crud) when update user method is called', function (done) {
    // Nothing emitted at the beginning
    expect(wrapper.emitted().crud).toBeUndefined();

    // Call update user axios function
    wrapper.vm.updateUser(wrapper.vm.crudUser.id, wrapper.vm.crudUser);

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: 'Mock update success'
      }).then(function () {
        expect(wrapper.emitted().crud).toBeTruthy();
        done();
      });
    });
  });

  it('emits (crud) when delete user method are called', function (done) {
    // Nothing emitted at the beginning
    expect(wrapper.emitted().crud).toBeUndefined();

    // Call delete user axios function
    wrapper.vm.deleteUser(wrapper.vm.crudUser.id);

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 204,
        response: 'Mock delete success'
      }).then(function () {
        expect(wrapper.emitted().crud).toBeTruthy();
        done();
      });
    });
  });
});
