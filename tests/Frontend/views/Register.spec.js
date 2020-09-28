import { createLocalVue, mount } from '@vue/test-utils';
import Register from '../../../resources/js/views/Register';
import BootstrapVue, { IconsPlugin } from 'bootstrap-vue';
import moxios from 'moxios';
import sinon from 'sinon';

const localVue = createLocalVue();

localVue.use(BootstrapVue);
localVue.use(IconsPlugin);

describe('Register', function () {
  let wrapper;
  let flashMessageSpySuccess;
  let flashMessageSpyError;
  let flashMessage;
  let div;

  beforeEach(function () {
    flashMessageSpyError = sinon.spy();
    flashMessageSpySuccess = sinon.spy();
    flashMessage = {
      error (param) {
        flashMessageSpyError(param);
      },
      success (param) {
        flashMessageSpySuccess(param);
      }
    };

    wrapper = mount(Register, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      data () {
        return {
          isPublicRegistration: null,
          errors: []
        };
      },
      computed: {
        openRegistration: function () {
          return true; // Mock store getters return true
        }
      },
      mounted () {
        this.isPublicRegistration = this.openRegistration;
      },
      attachTo: div
    });

    div = document.createElement('div');
    document.body.appendChild(div);

    moxios.install();
  });

  afterEach(function () {
    moxios.uninstall();
  });

  it('checks invitation token when mounted, if it is not open registration', async function () {
    wrapper = mount(Register, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      data () {
        return {
          isPublicRegistration: null,
          errors: []
        };
      },
      computed: {
        openRegistration: function () {
          return false; // Mock store getters return false
        }
      },
      methods: {
        checkInvitationToken () {}
      },
      mounted () {
        this.isPublicRegistration = this.openRegistration;
      },
      attachTo: div
    });

    const tokenSpy = sinon.spy(wrapper.vm, 'checkInvitationToken');

    expect(tokenSpy.called).toBeFalsy();

    await wrapper.vm.$nextTick();

    expect(tokenSpy.called).toBeTruthy();
  });

  it('does not check invitation token when mounted, if it is open registration', async function () {
    wrapper = mount(Register, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      data () {
        return {
          isPublicRegistration: null,
          errors: []
        };
      },
      computed: {
        openRegistration: function () {
          return true; // Mock store getters return true
        }
      },
      mounted () {
        this.isPublicRegistration = this.openRegistration;
      },
      attachTo: div
    });

    const tokenSpy = sinon.spy(wrapper.vm, 'checkInvitationToken');

    expect(tokenSpy.called).toBeFalsy();

    await wrapper.vm.$nextTick();

    expect(tokenSpy.called).toBeFalsy();
  });
});
