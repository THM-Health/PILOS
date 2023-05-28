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
import BulkImportMembersComponent from "../../../../resources/js/components/Room/BulkImportMembersComponent.vue";
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

  it ('bulk import members', async()=>{
   PermissionService.setCurrentUser(exampleUser);
   const view = mount(BulkImportMembersComponent, {
     localVue,
     mocks: {
       $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
       $d: (date, format) => date.toDateString() //could maybe be removed
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

   //find modal
   const modal = view.findComponent({ ref: 'bulk-import-modal' });
   expect(modal.exists()).toBeTruthy();

   // check if modal is closed and try to open it
   expect(modal.find('.modal').element.style.display).toEqual('none');

   //check if button to open the modal exists and shows correct title
   let bulkImportButton = view.findComponent({ref: 'bulk-import-members-button'});
   expect(bulkImportButton.exists()).toBeTruthy();
   expect(bulkImportButton.text()).toBe('rooms.members.bulk_import_users')

    //try to open modal
    await waitModalShown(view, () => {
      bulkImportButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    //check if data is set right
    expect(view.vm.$data.step).toBe(0);
    expect(view.vm.$data.rawList).toBe('');
    expect(view.vm.$data.validUsers.length).toBe(0);
    expect(view.vm.$data.invalidUsers.length).toBe(0);
    expect(view.vm.$data.errors.length).toBe(0);

    //check if textarea exists and is empty
    let textarea = modal.findComponent(BFormTextarea);
    expect(textarea.exists()).toBeTruthy();
    expect(textarea.text()).toBe('');

    //check if checkboxes exist and if the first one is checked
    let roleSelector = modal.findAllComponents(BFormRadio);
    expect(roleSelector.length).toBe(3);
    expect(roleSelector.at(0).text()).toBe('rooms.roles.participant');
    expect(roleSelector.at(1).text()).toBe('rooms.roles.moderator');
    expect(roleSelector.at(2).text()).toBe('rooms.roles.co_owner');

    expect(roleSelector.at(0).find('input').attributes('value')).toBe('1');
    expect(roleSelector.at(1).find('input').attributes('value')).toBe('2');
    expect(roleSelector.at(2).find('input').attributes('value')).toBe('3');

    expect(roleSelector.at(0).find('input').element.checked).toBeTruthy();

    //check if button exists, shows correct text and if it is disabled
    let firstStepButtons = modal.findAllComponents(BButton);
    expect(firstStepButtons.length).toBe(1);
    expect(firstStepButtons.at(0).text()).toBe('rooms.members.modals.add.add');
    expect(firstStepButtons.at(0).element.disabled).toBeTruthy();

    //enter text in textarea and check if button is enabled
    textarea.setValue('LauraWRivera@domain.tld\nLauraMWalter@domain.tld');
    await view.vm.$nextTick();
    expect(firstStepButtons.at(0).element.disabled).toBeFalsy();

    //confirm add of new users
    firstStepButtons.at(0).trigger('click');

    //check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    let request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('post');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/bulk');
    expect(JSON.parse(request.config.data).user_emails.length).toBe(2);

    await request.respondWith({
      status: 204
    });

    //check if data is set correctly
    expect(view.vm.$data.step).toBe(2);
    expect(view.vm.$data.rawList).toBe('LauraWRivera@domain.tld\nLauraMWalter@domain.tld');
    expect(view.vm.$data.validUsers.length).toBe(2);
    expect(view.vm.$data.invalidUsers.length).toBe(0);
    expect(view.vm.$data.errors.length).toBe(0);

    //check if modal shows correctly
    //check if list shows correctly
    let lastStepLists = modal.findAllComponents(BListGroup);
    expect(lastStepLists.length).toBe(1);
    let lastStepListGroupItemsValid = lastStepLists.at(0).findAllComponents(BListGroupItem);
    expect(lastStepListGroupItemsValid.length).toBe(2);
    expect(lastStepListGroupItemsValid.at(0).text()).toBe('laurawrivera@domain.tld');
    expect(lastStepListGroupItemsValid.at(1).text()).toBe('lauramwalter@domain.tld');

    //check if button exists and shows the correct text
    let lastStepButtons = modal.findAllComponents(BButton);
    expect(lastStepButtons.length).toBe(1);
    expect(lastStepButtons.at(0).text()).toBe('app.close');

    //check if modal closes when the button is clicked
    await waitModalHidden(view, async()=> {
      lastStepButtons.at(0).trigger('click');
    });
    expect(modal.find('.modal').element.style.display).toEqual('none');

    //check if modal opens again
    await waitModalShown(view, () => {
      bulkImportButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    //check if data is reset right
    expect(view.vm.$data.step).toBe(0);
    expect(view.vm.$data.rawList).toBe('');
    expect(view.vm.$data.validUsers.length).toBe(2);
    expect(view.vm.$data.invalidUsers.length).toBe(0);
    expect(view.vm.$data.errors.length).toBe(0);

    view.destroy();
  });

  it('bulk import members with errors', async () =>{
    PermissionService.setCurrentUser(exampleUser);
    const view = mount(BulkImportMembersComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: (date, format) => date.toDateString() //could maybe be removed
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

    //find modal
    const modal = view.findComponent({ ref: 'bulk-import-modal' });
    expect(modal.exists()).toBeTruthy();

    // check if modal is closed and try to open it
    expect(modal.find('.modal').element.style.display).toEqual('none');

    let bulkImportButton = view.findComponent({ref: 'bulk-import-members-button'});
    await waitModalShown(view, () => {
      bulkImportButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    //enter text in textarea and check if button is enabled
    let firstStepButtons = modal.findAllComponents(BButton);
    let textarea = modal.findComponent(BFormTextarea);
    textarea.setValue('LauraWRivera@domain.tld\nnotAnEmail');
    await view.vm.$nextTick();
    expect(firstStepButtons.at(0).element.disabled).toBeFalsy();

    //confirm add of new users
    firstStepButtons.at(0).trigger('click');

    //check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    let request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('post');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/bulk');
    expect(JSON.parse(request.config.data).user_emails.length).toBe(2);

    await request.respondWith({
      status: 422,
      response: {
        message: 'notanemail must be a valid email adress.',
        errors: {
          "user_emails.1": ['notanemail must be a valid email adress.']
        }
      }
    });
    //check if data is set correctly
    expect(view.vm.$data.step).toBe(1);
    expect(view.vm.$data.rawList).toBe('LauraWRivera@domain.tld\nnotAnEmail');
    expect(view.vm.$data.validUsers.length).toBe(1);
    expect(view.vm.$data.validUsers[0].email).toBe('laurawrivera@domain.tld');
    expect(view.vm.$data.invalidUsers.length).toBe(1);
    expect(view.vm.$data.invalidUsers[0].email).toBe('notanemail');
    expect(view.vm.$data.invalidUsers[0].error).toBe('notanemail must be a valid email adress.');
    expect(view.vm.$data.errors.length).toBe(0);

    //check if modal shows correctly
    //check if list shows correctly
    let middleStepLists = modal.findAllComponents(BListGroup);
    expect(middleStepLists.length).toBe(2);
    let middleStepListGroupItemsValid = middleStepLists.at(0).findAllComponents(BListGroupItem);
    expect(middleStepListGroupItemsValid.length).toBe(1);
    expect(middleStepListGroupItemsValid.at(0).text()).toBe('laurawrivera@domain.tld');
    let middleStepListGroupItemsInvalid = middleStepLists.at(1).findAllComponents(BListGroupItem);
    expect(middleStepListGroupItemsInvalid.length).toBe(1);
    //console.log(middleStepListGroupItemsInvalid.at(0).text());
    //expect(middleStepListGroupItemsInvalid.at(0).text()).toBe('notanemail');

    //check if error and button exist
    let errorCollapse = middleStepListGroupItemsInvalid.at(0).findComponent(BCollapse);
    let errorButton = middleStepListGroupItemsInvalid.at(0).findComponent(BButton);
    expect(errorButton.exists()).toBeTruthy();
    expect(errorCollapse.exists()).toBeTruthy();
    expect(errorCollapse.element.style.display).toEqual('none');

    //Try to open the collapse
    errorButton.trigger('click');
    await view.vm.$nextTick();
    expect(errorCollapse.element.style.display).toEqual('');
    expect(errorCollapse.text()).toBe('notanemail must be a valid email adress.');

    //check if button exists and shows the correct text
    let middleStepButtons = modal.findAllComponents(BButton);
    expect(middleStepButtons.length).toBe(3);
    expect(middleStepButtons.at(1).text()).toBe('app.back');
    expect(middleStepButtons.at(2).text()).toBe('rooms.members.modals.bulk_import.import_importable_button');

  });
});
