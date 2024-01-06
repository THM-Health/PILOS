import BulkImportMembersComponent from "@/components/Room/BulkImportMembersComponent.vue";
import BootstrapVue from "bootstrap-vue";
import {PiniaVuePlugin} from "pinia";
import {createLocalVue} from "@vue/test-utils";
import {createTestingPinia} from "@pinia/testing";
import Base from "../../resources/js/api/base.js";

const localVue = createLocalVue();

localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };
const ownerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false };
const initialState = { auth: { currentUser: exampleUser } };

describe('<BulkImportMembersComponent />', () => {

  it ('bulk import members with only valid users', ()=>{
    cy.viewport(600, 750);
    const onImportedSpy = cy.spy().as('onImportedSpy');
    cy.intercept('POST', 'api/v1/rooms/123-456-789/member/bulk',{
      statusCode:204,
      body:{},
    })
    //ToDo find better way
    cy.mount(BulkImportMembersComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      propsData: {
        roomId: ownerRoom.id,
        modalStatic: true,
        imported: onImportedSpy()
      },
      stubs: {
        transition: false
      },
      pinia: createTestingPinia({ initialState, createSpy: cy.spy()}),
    });

    //check that modal is hidden
    cy.get('.modal').should('not.be.visible');

    //check if button to open modal exists, shows correct title and try to open modal
    // cy.get(BButton);
    cy.get('button').eq(0).as('bulkImportButton');
    cy.get('@bulkImportButton').should('contain.text','rooms.members.bulk_import_users').click();
    cy.get('.modal').should('be.visible');

    //ToDo?
    //Check role selection
    //Check if texts are shown
    cy.get('[data-cy="roleSelection"]').get('.badge').should('have.length', 3).eq(0).contains('rooms.roles.participant');
    cy.get('[data-cy="roleSelection"]').get('.badge').eq(1).contains('rooms.roles.moderator');
    cy.get('[data-cy="roleSelection"]').get('.badge').eq(2).contains('rooms.roles.co_owner');

    //check if checkboxes exist and if the first one is checked
    cy.get('[data-cy="roleSelection"]').get('input').should('have.length', 3).eq(0).should('have.value', 1).and('be.checked');
    cy.get('[data-cy="roleSelection"]').get('input').eq(1).should('have.value', 2).and('not.be.checked');
    cy.get('[data-cy="roleSelection"]').get('input').eq(2).should('have.value', 3).and('not.be.checked');

    //Check if texts are shown
    // cy.get('.badge').should('have.length', 3).eq(0).contains('rooms.roles.participant');
    // cy.get('.badge').eq(1).contains('rooms.roles.moderator');
    // cy.get('.badge').eq(2).contains('rooms.roles.co_owner');

    //check if checkboxes exist and if the first one is checked
    // cy.get('[data-cy="roleSelect"]').should('have.length', 3).eq(0).should('have.value', 1).and('be.checked');
    // cy.get('[data-cy="roleSelect"]').eq(1).should('have.value', 2).and('not.be.checked');
    // cy.get('[data-cy="roleSelect"]').eq(2).should('have.value', 3).and('not.be.checked');

    cy.get('button').eq(2).as('firstStepButton');
    cy.get('@firstStepButton').should('contain.text', 'rooms.members.modals.add.add').should('be.disabled');

    // check if textarea exists, is empty and enter text
    cy.get('textarea').should('have.value', '').type('LauraWRivera@domain.tld\nLauraMWalter@domain.tld');

    //click on button (also checks if disabled)
    cy.get('@firstStepButton').click();
    cy.get('@onImportedSpy').should('have.been.calledOnce');

    //check if list shows correctly (ToDo try to find a way to use BulkImportMembersListComponent?)
    cy.get('.list-group-item').should('have.length', 2).and('contain.class', 'list-group-item-success').eq(0).should('contain.text', 'laurawrivera@domain.tld');
    cy.get('.list-group-item').eq(1).should('contain.text', 'lauramwalter@domain.tld');
    cy.get('.badge').should('contain.text', 2)

    //check if button exists and shows the correct text, and close modal
    cy.get('button').eq(2).should('contain.text', 'app.close').click();
    cy.get('.modal').should('not.be.visible');

    //check if modal opens again
    cy.get('@bulkImportButton').click();
    cy.get('.modal').should('be.visible');

    //check if button is disabled, textarea is empty and enter text
    cy.get('@firstStepButton').should('be.disabled');
    cy.get('textarea').should('have.value', '').type('TammyGLaw@domain.tld');

    //click on button (also checks if disabled)
    cy.get('@firstStepButton').click();
    cy.get('@onImportedSpy').should('have.been.calledOnce');

    // check if list shows correctly (ToDo try to find a way to use BulkImportMembersListComponent?)
    cy.get('.list-group-item').should('have.length', 1).and('contain.class', 'list-group-item-success').should('contain.text', 'tammyglaw@domain.tld');
  });

  it('bulk import members with errors', () =>{
    cy.viewport(600, 750);
    cy.stub(Base, 'error').as('baseError');

    cy.mount(BulkImportMembersComponent, {
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
      pinia: createTestingPinia({ initialState, createSpy: cy.spy()}),
    })

    cy.get('.modal').should('not.be.visible');

    //open modal
    cy.get('button').eq(0).click();
    cy.get('.modal').should('be.visible');

    //check if button is disabled, textarea is empty and enter text
    cy.get('button').eq(2).as('firstStepButton');
    cy.get('@firstStepButton').should('be.disabled');
    cy.get('textarea').should('be.visible');
    cy.get('textarea').should('have.value', '').type('\n');

    cy.intercept('POST', 'api/v1/rooms/123-456-789/member/bulk',{
      statusCode:422,
      body:{
        errors:{
          user_emails: ['The user emails field is required.']
        }
      },
    });

    //click on button (also checks if disabled)
    cy.get('@firstStepButton').click();

    //check if shows correctly and type new user
    cy.get('textarea').should('be.visible');
    cy.get('textarea').should('have.value', '\n').type('laurawrivera@domain.tld');
    cy.contains('The user emails field is required.');

    cy.intercept('POST', 'api/v1/rooms/123-456-789/member/bulk',{
      statusCode:422,
      body:{
        errors:{
          role: ['The selected role is invalid.']
        }
      },
    });

    //confirm add of new users (also checks if disabled)
    cy.get('@firstStepButton').click();

    //check if shows correctly
    cy.get('textarea').should('have.value', '\nlaurawrivera@domain.tld');
    cy.contains('The selected role is invalid.');

    cy.intercept('POST', 'api/v1/rooms/123-456-789/member/bulk', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    });

    //confirm add of new users (also checks if disabled)
    cy.get('@firstStepButton').click();

    cy.get('@baseError').should('have.been.calledOnce');

    //check if shows correctly
    cy.get('.modal').should('be.visible');
    cy.get('textarea').should('have.value', '\nlaurawrivera@domain.tld');
  });
})
