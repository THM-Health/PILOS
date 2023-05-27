import { mount } from '@vue/test-utils';
import BootstrapVue, {
  BButton,
  BFormInvalidFeedback,
  BFormRadio, BFormTextarea,
  BTbody,
  BThead,
  BTr
} from 'bootstrap-vue';
import moxios from 'moxios';
import MembersComponent from '../../../../resources/js/components/Room/MembersComponent.vue';
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
    let bulkImportAddButton = modal.findAllComponents(BButton);
    expect(bulkImportAddButton.length).toBe(1);
    expect(bulkImportAddButton.at(0).text()).toBe('rooms.members.modals.add.add');
    expect(bulkImportAddButton.at(0).element.disabled).toBeTruthy();

    //enter text in textarea and check if button is enabled
    textarea.setValue('Laura');
    await view.vm.$nextTick();
    expect(bulkImportAddButton.at(0).element.disabled).toBeFalsy();


  });
});
