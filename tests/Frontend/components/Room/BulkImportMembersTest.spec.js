import { mount } from '@vue/test-utils';
import BootstrapVue, {
  BButton, BCollapse,
  BFormInvalidFeedback,
  BFormRadio, BFormTextarea, BListGroup, BListGroupItem,
  BTbody,
  BThead,
  BTr
} from 'bootstrap-vue';
import moxios from 'moxios';
import VueClipboard from 'vue-clipboard2';
import Base from '../../../../resources/js/api/base';
import PermissionService from '../../../../resources/js/services/PermissionService';
import { waitModalHidden, waitModalShown, waitMoxios, createContainer, createLocalVue } from '../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import BulkImportMembersComponent from '../../../../resources/js/components/Room/BulkImportMembersComponent.vue';
const localVue = createLocalVue();

localVue.use(BootstrapVue);
localVue.use(VueClipboard);
localVue.use(PiniaVuePlugin);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };
const ownerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false };
const coOwnerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 2, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: true, is_co_owner: true, is_moderator: false, can_start: false, running: false };

const initialState = { auth: { currentUser: exampleUser } };

describe('RoomMembersBulk', () => {
  beforeEach(() => {
    moxios.install();
  });
  afterEach(() => {
    moxios.uninstall();
  });

  it('bulk import members with only valid users', async () => {
    PermissionService.setCurrentUser(exampleUser);
    const view = mount(BulkImportMembersComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      propsData: {
        roomId: ownerRoom.id,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    // find modal
    const modal = view.findComponent({ ref: 'bulk-import-modal' });
    expect(modal.exists()).toBeTruthy();

    // check if modal is closed
    expect(modal.find('.modal').element.style.display).toEqual('none');

    // check if button to open the modal exists and shows correct title
    const bulkImportButton = view.findComponent({ ref: 'bulk-import-members-button' });
    expect(bulkImportButton.exists()).toBeTruthy();
    expect(bulkImportButton.text()).toBe('rooms.members.bulk_import_users');

    // try to open modal
    await waitModalShown(view, () => {
      bulkImportButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // check if textarea exists and is empty
    let textarea = modal.findComponent(BFormTextarea);
    expect(textarea.exists()).toBeTruthy();
    expect(textarea.element.value).toBe('');

    // check if checkboxes exist and if the first one is checked
    const roleSelector = modal.findAllComponents(BFormRadio);
    expect(roleSelector.length).toBe(3);
    expect(roleSelector.at(0).text()).toBe('rooms.roles.participant');
    expect(roleSelector.at(1).text()).toBe('rooms.roles.moderator');
    expect(roleSelector.at(2).text()).toBe('rooms.roles.co_owner');

    expect(roleSelector.at(0).find('input').attributes('value')).toBe('1');
    expect(roleSelector.at(1).find('input').attributes('value')).toBe('2');
    expect(roleSelector.at(2).find('input').attributes('value')).toBe('3');

    expect(roleSelector.at(0).find('input').element.checked).toBeTruthy();

    // check if button exists, shows correct text and if it is disabled
    const firstStepButtons = modal.findAllComponents(BButton);
    expect(firstStepButtons.length).toBe(1);
    expect(firstStepButtons.at(0).text()).toBe('rooms.members.modals.add.add');
    expect(firstStepButtons.at(0).element.disabled).toBeTruthy();

    // enter text in textarea and check if button is enabled
    await textarea.setValue('LauraWRivera@domain.tld\nLauraMWalter@domain.tld');
    expect(firstStepButtons.at(0).element.disabled).toBeFalsy();

    // confirm add of new users
    firstStepButtons.at(0).trigger('click');

    // check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    let request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('post');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/bulk');
    expect(JSON.parse(request.config.data).user_emails.length).toBe(2);

    await request.respondWith({
      status: 204
    });

    // check if 'imported' was emitted to reload the member list
    console.log(view.emitted());
    expect(view.emitted()).toHaveProperty('imported');

    // check if modal shows correctly
    // check if list shows correctly
    let lastStepLists = modal.findAllComponents(BListGroup);
    expect(lastStepLists.length).toBe(1);
    let lastStepListGroupItemsValid = lastStepLists.at(0).findAllComponents(BListGroupItem);
    expect(lastStepListGroupItemsValid.length).toBe(2);
    expect(lastStepListGroupItemsValid.at(0).text()).toBe('laurawrivera@domain.tld');
    expect(lastStepListGroupItemsValid.at(1).text()).toBe('lauramwalter@domain.tld');

    // check if button exists and shows the correct text
    const lastStepButtons = modal.findAllComponents(BButton);
    expect(lastStepButtons.length).toBe(1);
    expect(lastStepButtons.at(0).text()).toBe('app.close');

    // check if modal closes when the button is clicked
    await waitModalHidden(view, async () => {
      lastStepButtons.at(0).trigger('click');
    });
    expect(modal.find('.modal').element.style.display).toEqual('none');

    // check if modal opens again
    await waitModalShown(view, () => {
      bulkImportButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // check if textarea exists, is empty and button is disabled
    textarea = modal.findComponent(BFormTextarea);
    expect(textarea.exists()).toBeTruthy();
    expect(textarea.element.value).toBe('');
    expect(firstStepButtons.at(0).element.disabled).toBeTruthy();

    // enter text in textarea and check if button is enabled
    await textarea.setValue('TammyGLaw@domain.tld');
    expect(firstStepButtons.at(0).element.disabled).toBeFalsy();

    // confirm add of new users
    firstStepButtons.at(0).trigger('click');

    // check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('post');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/bulk');
    expect(JSON.parse(request.config.data).user_emails.length).toBe(1);

    await request.respondWith({
      status: 204
    });

    // check if modal shows correctly
    // check if list shows correctly
    lastStepLists = modal.findAllComponents(BListGroup);
    expect(lastStepLists.length).toBe(1);
    lastStepListGroupItemsValid = lastStepLists.at(0).findAllComponents(BListGroupItem);
    expect(lastStepListGroupItemsValid.length).toBe(1);
    expect(lastStepListGroupItemsValid.at(0).text()).toBe('tammyglaw@domain.tld');

    // check if modal closes when the button is clicked
    await waitModalHidden(view, async () => {
      lastStepButtons.at(0).trigger('click');
    });
    expect(modal.find('.modal').element.style.display).toEqual('none');

    view.destroy();
  });

  it('bulk import members with valid and invalid users', async () => {
    PermissionService.setCurrentUser(exampleUser);
    const view = mount(BulkImportMembersComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      propsData: {
        roomId: ownerRoom.id,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    // find modal
    const modal = view.findComponent({ ref: 'bulk-import-modal' });
    expect(modal.exists()).toBeTruthy();

    // check if modal is closed and try to open it
    expect(modal.find('.modal').element.style.display).toEqual('none');
    const bulkImportButton = view.findComponent({ ref: 'bulk-import-members-button' });
    await waitModalShown(view, () => {
      bulkImportButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // enter text in textarea and check if button is enabled
    const firstStepButtons = modal.findAllComponents(BButton);
    const textarea = modal.findComponent(BFormTextarea);
    await textarea.setValue('LauraWRivera@domain.tld\nnotAnEmail');
    expect(firstStepButtons.at(0).element.disabled).toBeFalsy();

    // confirm add of new users
    firstStepButtons.at(0).trigger('click');

    // check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    let request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('post');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/bulk');
    expect(JSON.parse(request.config.data).user_emails.length).toBe(2);

    await request.respondWith({
      status: 422,
      response: {
        errors: {
          'user_emails.1': ['notanemail must be a valid email adress.']
        }
      }
    });

    // check if modal shows correctly
    // check if lists show correctly
    const middleStepLists = modal.findAllComponents(BListGroup);
    expect(middleStepLists.length).toBe(2);
    const middleStepListGroupItemsValid = middleStepLists.at(0).findAllComponents(BListGroupItem);
    expect(middleStepListGroupItemsValid.length).toBe(1);
    expect(middleStepListGroupItemsValid.at(0).text()).toBe('laurawrivera@domain.tld');
    const middleStepListGroupItemsInvalid = middleStepLists.at(1).findAllComponents(BListGroupItem);
    expect(middleStepListGroupItemsInvalid.length).toBe(1);
    expect(middleStepListGroupItemsInvalid.at(0).find('span').text()).toBe('notanemail');

    // check if error and button exist
    const errorCollapse = middleStepListGroupItemsInvalid.at(0).findComponent(BCollapse);
    const errorButton = middleStepListGroupItemsInvalid.at(0).findComponent(BButton);
    expect(errorButton.exists()).toBeTruthy();
    expect(errorCollapse.exists()).toBeTruthy();
    expect(errorCollapse.element.style.display).toEqual('none');

    // Try to open the collapse
    errorButton.trigger('click');
    await view.vm.$nextTick();
    expect(errorCollapse.element.style.display).toEqual('');
    expect(errorCollapse.text()).toBe('notanemail must be a valid email adress.');

    // check if button exist and show the correct text
    const middleStepButtons = modal.findAllComponents(BButton);
    expect(middleStepButtons.length).toBe(3);
    expect(middleStepButtons.at(1).text()).toBe('app.back');
    expect(middleStepButtons.at(2).text()).toBe('rooms.members.modals.bulk_import.import_importable_button');

    // Try to add the valid users
    middleStepButtons.at(2).trigger('click');

    // check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('post');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/bulk');
    expect(JSON.parse(request.config.data).user_emails.length).toBe(1);

    await request.respondWith({
      status: 204
    });

    // check if modal shows correctly
    // check if lists show correctly
    const lastStepLists = modal.findAllComponents(BListGroup);
    expect(lastStepLists.length).toBe(2);
    const lastStepListGroupValid = lastStepLists.at(0).findAllComponents(BListGroupItem);
    expect(lastStepListGroupValid.length).toBe(1);
    expect(lastStepListGroupValid.at(0).text()).toBe('laurawrivera@domain.tld');
    const lastStepListGroupInvalid = lastStepLists.at(1).findAllComponents(BListGroupItem);
    expect(lastStepListGroupInvalid.length).toBe(1);
    expect(lastStepListGroupInvalid.at(0).find('span').text()).toBe('notanemail');

    // check if error and button exist
    const errorCollapseLastStep = lastStepListGroupInvalid.at(0).findComponent(BCollapse);
    const errorButtonLastStep = lastStepListGroupInvalid.at(0).findComponent(BButton);
    expect(errorButtonLastStep.exists()).toBeTruthy();
    expect(errorCollapseLastStep.exists()).toBeTruthy();
    expect(errorCollapseLastStep.element.style.display).toEqual('');

    // Try to open the collapse
    errorButtonLastStep.trigger('click');
    await view.vm.$nextTick();
    expect(errorCollapseLastStep.element.style.display).toEqual('block');
    expect(errorCollapseLastStep.text()).toBe('notanemail must be a valid email adress.');

    // check if button exist and show the correct text
    const lastStepButtons = modal.findAllComponents(BButton);
    expect(lastStepButtons.length).toBe(3);
    expect(lastStepButtons.at(1).text()).toBe('app.close');
    expect(lastStepButtons.at(2).text()).toBe('rooms.members.modals.bulk_import.copy_and_close');

    // check if modal closes when the close button is clicked
    await waitModalHidden(view, async () => {
      lastStepButtons.at(1).trigger('click');
    });
    expect(modal.find('.modal').element.style.display).toEqual('none');

    view.destroy();
  });

  it('bulk import members with only invalid users', async () => {
    PermissionService.setCurrentUser(exampleUser);
    const view = mount(BulkImportMembersComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      propsData: {
        roomId: ownerRoom.id,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    // find modal
    const modal = view.findComponent({ ref: 'bulk-import-modal' });
    expect(modal.exists()).toBeTruthy();

    // check if modal is closed and try to open it
    expect(modal.find('.modal').element.style.display).toEqual('none');
    const bulkImportButton = view.findComponent({ ref: 'bulk-import-members-button' });
    await waitModalShown(view, () => {
      bulkImportButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // enter text in textarea and check if button is enabled
    const firstStepButtons = modal.findAllComponents(BButton);
    let textarea = modal.findComponent(BFormTextarea);
    await textarea.setValue('invalidEmail@domain.tld\nnotAnEmail');
    expect(firstStepButtons.at(0).element.disabled).toBeFalsy();

    // confirm add of new users
    firstStepButtons.at(0).trigger('click');

    // check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    let request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('post');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/bulk');
    expect(JSON.parse(request.config.data).user_emails.length).toBe(2);

    await request.respondWith({
      status: 422,
      response: {
        errors: {
          'user_emails.0': ['No user was found with this e-mail'],
          'user_emails.1': ['notanemail must be a valid email adress.']
        }
      }
    });

    // check if modal shows correctly
    // check if list shows correctly
    const middleStepLists = modal.findAllComponents(BListGroup);
    expect(middleStepLists.length).toBe(1);
    const middleStepListGroupItemsInvalid = middleStepLists.at(0).findAllComponents(BListGroupItem);
    expect(middleStepListGroupItemsInvalid.length).toBe(2);
    expect(middleStepListGroupItemsInvalid.at(0).find('span').text()).toBe('invalidemail@domain.tld');
    expect(middleStepListGroupItemsInvalid.at(1).find('span').text()).toBe('notanemail');

    // check if error and button exist
    const errorCollapse0 = middleStepListGroupItemsInvalid.at(0).findComponent(BCollapse);
    const errorCollapse1 = middleStepListGroupItemsInvalid.at(1).findComponent(BCollapse);
    const errorButton0 = middleStepListGroupItemsInvalid.at(0).findComponent(BButton);
    const errorButton1 = middleStepListGroupItemsInvalid.at(1).findComponent(BButton);
    expect(errorButton0.exists()).toBeTruthy();
    expect(errorButton1.exists()).toBeTruthy();
    expect(errorCollapse0.exists()).toBeTruthy();
    expect(errorCollapse1.exists()).toBeTruthy();
    expect(errorCollapse0.element.style.display).toEqual('none');
    expect(errorCollapse1.element.style.display).toEqual('none');

    // Try to open the collapse
    errorButton0.trigger('click');
    await view.vm.$nextTick();
    expect(errorCollapse0.element.style.display).toEqual('');
    expect(errorCollapse0.text()).toBe('No user was found with this e-mail');
    errorButton1.trigger('click');
    await view.vm.$nextTick();
    expect(errorCollapse1.element.style.display).toEqual('');
    expect(errorCollapse1.text()).toBe('notanemail must be a valid email adress.');

    // check if button exists and shows the correct text
    const middleStepButtons = modal.findAllComponents(BButton);
    expect(middleStepButtons.length).toBe(3);
    expect(middleStepButtons.at(2).text()).toBe('app.back');

    // Try to go back
    middleStepButtons.at(2).trigger('click');
    await view.vm.$nextTick();

    // check if textarea is shown again and with the correct values
    textarea = modal.findComponent(BFormTextarea);
    expect(textarea.exists()).toBeTruthy();
    expect(textarea.element.value).toBe('invalidEmail@domain.tld\nnotAnEmail');
    expect(firstStepButtons.at(0).element.disabled).toBeFalsy();

    // enter corrected text in textarea and check if button is still enabled
    await textarea.setValue('TammyGLaw@domain.tld');
    expect(firstStepButtons.at(0).element.disabled).toBeFalsy();

    // confirm add of new users
    firstStepButtons.at(0).trigger('click');

    // check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('post');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/bulk');
    expect(JSON.parse(request.config.data).user_emails.length).toBe(1);

    await request.respondWith({
      status: 204
    });

    // check if modal shows correctly
    // check if list shows correctly
    const lastStepLists = modal.findAllComponents(BListGroup);
    expect(lastStepLists.length).toBe(1);
    const lastStepListGroupItemsValid = lastStepLists.at(0).findAllComponents(BListGroupItem);
    expect(lastStepListGroupItemsValid.length).toBe(1);
    expect(lastStepListGroupItemsValid.at(0).text()).toBe('tammyglaw@domain.tld');

    // check if button exists and shows the correct text
    const lastStepButtons = modal.findAllComponents(BButton);
    expect(lastStepButtons.length).toBe(1);
    expect(lastStepButtons.at(0).text()).toBe('app.close');

    // check if modal closes when the button is clicked
    await waitModalHidden(view, async () => {
      lastStepButtons.at(0).trigger('click');
    });
    expect(modal.find('.modal').element.style.display).toEqual('none');

    view.destroy();
  });

  it('bulk import members with errors', async()=> {
    PermissionService.setCurrentUser(exampleUser);
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});
    const view = mount(BulkImportMembersComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      propsData: {
        roomId: ownerRoom.id,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    // find modal
    const modal = view.findComponent({ ref: 'bulk-import-modal' });
    expect(modal.exists()).toBeTruthy();

    // check if modal is closed and try to open it
    expect(modal.find('.modal').element.style.display).toEqual('none');
    const bulkImportButton = view.findComponent({ ref: 'bulk-import-members-button' });
    await waitModalShown(view, () => {
      bulkImportButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // enter text in textarea and check if button is enabled
    const firstStepButtons = modal.findAllComponents(BButton);
    let textarea = modal.findComponent(BFormTextarea);
    await textarea.setValue('\n');
    expect(firstStepButtons.at(0).element.disabled).toBeFalsy();

    // confirm add of new users
    firstStepButtons.at(0).trigger('click');

    // check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    let request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('post');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/bulk');
    expect(JSON.parse(request.config.data).user_emails.length).toBe(0);

    await request.respondWith({
      status: 422,
      response: {
        errors: {
          'user_emails': ['The user emails field is required.']
        }
      }
    });

    // check if modal shows correctly
    textarea = modal.findComponent(BFormTextarea);
    expect(textarea.element.value).toBe('\n');
    expect(firstStepButtons.at(0).element.disabled).toBeFalsy();
    expect (modal.html()).toContain('The user emails field is required.');

    textarea.setValue('laurawrivera@domain.tld');
    // confirm add of new users
    firstStepButtons.at(0).trigger('click');

    // check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('post');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/bulk');
    expect(JSON.parse(request.config.data).user_emails.length).toBe(1);

    await request.respondWith({
      status: 500,
      response: {
        message: 'Test'
      }
    });

    //check if modal is still open after error
    expect(modal.find('.modal').element.style.display).toEqual('block');

    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);

    view.destroy();
  });

});
