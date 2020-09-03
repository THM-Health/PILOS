import { createLocalVue, mount } from '@vue/test-utils';
import CrudLdapModalComponent from '../../../../resources/js/components/Admin/users/CrudLdapModalComponent';
import BootstrapVue, { IconsPlugin } from 'bootstrap-vue';
import moxios from 'moxios';
import sinon from 'sinon';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);

describe('CrudLdapModalComponent', function () {
  let wrapper;

  beforeEach(function () {
    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      error (param) {
        flashMessageSpy(param);
      },
      success (param) {
        flashMessageSpy(param);
      }
    };

    const div = document.createElement('div');
    document.body.appendChild(div);

    wrapper = mount(CrudLdapModalComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      propsData: {
        modalId: 'crud-ldap-modal',
        modalType: 'update',
        crudUser: {
          id: 1,
          firstname: 'max',
          lastname: 'mustermann',
          email: 'max@mustermann.com',
          password: 'secret',
          username: 'mstt',
          authenticator: 'ldap',
          guid: 'guid'
        }
      },
      data () {
        return {
          uid: 'mstttest',
          mail: 'test@mail.com',
          cn: 'cntest',
          givenname: 'givennametest',
          sn: 'sntest',
          isBusy: false,
          errors: []
        };
      },
      attachTo: div
    });

    moxios.install();
  });

  afterEach(function () {
    moxios.uninstall();
  });

  it('shows different type of modal based on modalType props', async function () {
    // Update Modal
    await wrapper.setProps({ modalType: 'update' });

    const crudModal = wrapper.find('#crud-ldap-modal');
    expect(crudModal.exists()).toBe(true);

    let deleteDiv = wrapper.find('#ldap-delete');
    let updateDiv = wrapper.find('#ldap-update');

    expect(deleteDiv.exists()).toBe(false);
    expect(updateDiv.exists()).toBe(true);

    // Delete Modal
    await wrapper.setProps({ modalType: 'delete' });

    updateDiv = wrapper.find('#ldap-update');
    deleteDiv = wrapper.find('#ldap-delete');

    expect(deleteDiv.exists()).toBe(true);
    expect(updateDiv.exists()).toBe(false);
  });

  it('resets variables when resetModal is called', function () {
    expect(wrapper.vm.uid).toBe('mstttest');
    expect(wrapper.vm.mail).toBe('test@mail.com');
    expect(wrapper.vm.cn).toBe('cntest');
    expect(wrapper.vm.sn).toBe('sntest');
    expect(wrapper.vm.givenname).toBe('givennametest');
    expect(wrapper.vm.crudUser.id).toBe(1);
    expect(wrapper.vm.crudUser.firstname).toBe('max');
    expect(wrapper.vm.crudUser.lastname).toBe('mustermann');
    expect(wrapper.vm.crudUser.password).toBe('secret');
    expect(wrapper.vm.crudUser.username).toBe('mstt');
    expect(wrapper.vm.crudUser.authenticator).toBe('ldap');
    expect(wrapper.vm.crudUser.guid).toBe('guid');

    wrapper.vm.resetModal();

    expect(wrapper.vm.uid).toBe(null);
    expect(wrapper.vm.mail).toBe(null);
    expect(wrapper.vm.cn).toBe(null);
    expect(wrapper.vm.sn).toBe(null);
    expect(wrapper.vm.givenname).toBe(null);
    expect(wrapper.vm.crudUser.id).toBe(null);
    expect(wrapper.vm.crudUser.firstname).toBe(null);
    expect(wrapper.vm.crudUser.lastname).toBe(null);
    expect(wrapper.vm.crudUser.password).toBe(null);
    expect(wrapper.vm.crudUser.username).toBe(null);
    expect(wrapper.vm.crudUser.authenticator).toBe(null);
    expect(wrapper.vm.crudUser.guid).toBe(null);
  });

  it('getUserLdapData should work properly', function (done) {
    // Call get user ldap axios function
    wrapper.vm.getUserLdapData(this.uid);

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          uid: ['getldap'],
          mail: ['getldap@test.com'],
          sn: ['Get'],
          entryuuid: ['524e759a-6cdf-103a-92fc-5bc96496e6ce'],
          givenname: ['Ldap'],
          cn: ['Get Ldap']
        }
      }).then(function () {
        expect(wrapper.vm.uid).toBe('getldap');
        expect(wrapper.vm.mail).toBe('getldap@test.com');
        expect(wrapper.vm.cn).toBe('Get Ldap');
        expect(wrapper.vm.sn).toBe('Get');
        expect(wrapper.vm.givenname).toBe('Ldap');
        done();
      });
    });
  });

  it('emits (crud-ldap) when update user method is called', function (done) {
    // Nothing emitted at the beginning
    expect(wrapper.emitted('crud-ldap')).toBeUndefined();

    // Call update ldap axios function
    wrapper.vm.updateLdap(this.uid);

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 202,
        response: 'Mock update success'
      }).then(function () {
        expect(wrapper.emitted('crud-ldap')).toBeTruthy();
        done();
      });
    });
  });

  it('emits (crud-ldap and crud-ldap-delete) when delete user method are called', function (done) {
    // Nothing emitted at the beginning
    expect(wrapper.emitted('crud-ldap')).toBeUndefined();
    expect(wrapper.emitted('crud-ldap-delete')).toBeUndefined();

    // Call delete ldap axios function
    wrapper.vm.deleteLdap(this.uid);

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 204,
        response: 'Mock delete success'
      }).then(function () {
        expect(wrapper.emitted('crud-ldap')).toBeTruthy();
        expect(wrapper.emitted('crud-ldap-delete')).toBeTruthy();
        done();
      });
    });
  });
});
