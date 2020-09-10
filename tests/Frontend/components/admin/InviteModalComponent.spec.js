import { createLocalVue, mount } from '@vue/test-utils';
import InviteModalComponent from '../../../../resources/js/components/Admin/users/InviteModalComponent';
import BootstrapVue, { IconsPlugin, BBadge } from 'bootstrap-vue';
import moxios from 'moxios';
import sinon from 'sinon';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);

describe('InviteModalComponent', function () {
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

    wrapper = mount(InviteModalComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      propsData: {
        modalId: 'invite-modal'
      },
      data () {
        return {
          isBusy: false,
          inputEmail: '',
          emails: [],
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

  it('has correct contents', function () {
    const inviteModal = wrapper.get('#invite-modal');
    expect(inviteModal.exists()).toBeTruthy();

    const inviteForm = wrapper.get('#invite-user-form');
    expect(inviteForm.exists()).toBeTruthy();
  });

  it('disables submit button if emails array is empty and enables submit button if emails array is not empty', async function () {
    const inviteSubmitButton = wrapper.get('#invite-submit-button');
    expect(inviteSubmitButton.exists()).toBeTruthy();
    expect(inviteSubmitButton.attributes('disabled')).toBeTruthy();

    await wrapper.setData({ emails: ['max@mustermann.com'] });

    expect(inviteSubmitButton.attributes('disabled')).toBeFalsy();

    await wrapper.setData({ emails: [] });

    expect(inviteSubmitButton.attributes('disabled')).toBeTruthy();
  });

  it('adds, shows and removes email badges and validates email input properly ', async function () {
    // No emails badges rendered at the beginning because emails array still empty
    let emailBadges = wrapper.findComponent(BBadge);
    expect(emailBadges.exists()).toBeFalsy();

    const addEmailButton = wrapper.get('#invite-add-email-button');
    expect(addEmailButton.exists()).toBeTruthy();

    const emailFormInput = wrapper.get('#invite-input-email');
    expect(emailFormInput.exists()).toBeTruthy();

    // User fills email input and click the add button
    await emailFormInput.setValue('max@mustermann.com');
    await addEmailButton.trigger('click');
    emailBadges = wrapper.findComponent(BBadge);
    expect(emailBadges.exists()).toBeTruthy();

    // User clicks the email badge
    await emailBadges.trigger('click');

    // Email badges component should be gone after the badge is clicked
    emailBadges = wrapper.findComponent(BBadge);
    expect(emailBadges.exists()).toBeFalsy();

    // User fills email input and click the add button, this time use invalid email input
    await emailFormInput.setValue('notvalidemailformat');
    await addEmailButton.trigger('click');

    // Email badges component should be empty because this behaviour catched by the isEmailValid method
    emailBadges = wrapper.findComponent(BBadge);
    expect(emailBadges.exists()).toBeFalsy();
  });

  it('resets component data variables when resetInviteModal method is called', async function () {
    await wrapper.setData({
      isBusy: true,
      inputEmail: 'test',
      emails: ['email'],
      errors: ['errors']
    });

    expect(wrapper.vm.isBusy).toBe(true);
    expect(wrapper.vm.inputEmail).toBe('test');
    expect(wrapper.vm.emails.length).toBe(1);
    expect(wrapper.vm.errors.length).toBe(1);

    wrapper.vm.resetInviteModal();

    expect(wrapper.vm.isBusy).toBe(false);
    expect(wrapper.vm.inputEmail).toBe('');
    expect(wrapper.vm.emails.length).toBe(0);
    expect(wrapper.vm.errors.length).toBe(0);
  });
});
