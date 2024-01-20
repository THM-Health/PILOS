import '../../support/commands.js'

//could maybe be moved to a fixture
const ownerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: true, running: false};

describe('Bulk import spec', () => {

  beforeEach(()=>{
    cy.init();
    //Todo decide what could be moved to a command and what should happen inside the tests
    cy.intercept('/api/v1/rooms/123-456-789/member',{"data":[{"id":4,"firstname":"Benutzer","lastname":"Nachname","email":"test4@test.de","role":3,"image":null}]})
    cy.intercept('/api/v1/rooms/123-456-789/tokens',{"data":[]})
    cy.intercept('/api/v1/rooms/123-456-789/settings',{"data":{"name":"aws","room_type":{"id":1,"description":"Lecture","color":"#16a085","allow_listing":false,"model_name":"RoomType","updated_at":"2023-12-19T06:35:18.000000Z","restrict":false},"access_code":490173384,"mute_on_start":false,"lock_settings_disable_cam":false,"webcams_only_for_moderator":false,"lock_settings_disable_mic":false,"lock_settings_disable_private_chat":false,"lock_settings_disable_public_chat":false,"lock_settings_disable_note":false,"lock_settings_lock_on_join":true,"lock_settings_hide_user_list":false,"everyone_can_start":false,"allow_guests":false,"allow_membership":false,"welcome":null,"short_description":null,"max_participants":null,"duration":null,"default_role":1,"lobby":0,"listed":false,"record_attendance":false}})
    cy.intercept('/api/v1/rooms/123-456-789/files',{"data":{"files":[],"default":null}})
    cy.intercept('/api/v1/rooms/123-456-789/meetings?*', {"data":[],"links":{"first":"http:\/\/localhost\/api\/v1\/rooms\/uov-k8g-vul\/meetings?page=1","last":"http:\/\/localhost\/api\/v1\/rooms\/uov-k8g-vul\/meetings?page=1","prev":null,"next":null},"meta":{"current_page":1,"from":null,"last_page":1,"links":[{"url":null,"label":"&laquo; Zur\u00fcck","active":false},{"url":"http:\/\/localhost\/api\/v1\/rooms\/uov-k8g-vul\/meetings?page=1","label":"1","active":true},{"url":null,"label":"Weiter &raquo;","active":false}],"path":"http:\/\/localhost\/api\/v1\/rooms\/uov-k8g-vul\/meetings","per_page":15,"to":null,"total":0}})
    cy.intercept('GET', 'api/v1/roomTypes*', {fixture: 'exampleRoomTypes.json'}).as('roomTypeRequest');

    cy.intercept('/api/v1/rooms/123-456-789', {data: ownerRoom}).as('roomRequest');
  });

  it ('bulk import members with only valid users', ()=>{

    cy.visit('/rooms/123-456-789');

    //Todo
    //cy.spy().as('onImportedSpy');
    cy.intercept('POST', 'api/v1/rooms/123-456-789/member/bulk',{
      statusCode:204,
      body:{},
    });

    //check if button to open modal exists, shows correct title and try to open modal
    cy.get('a').eq(10).click();
    cy.get('.modal').should('not.exist');
    cy.get('button').eq(10).as('bulkImportButton');
    cy.get('@bulkImportButton').should('contain.text','rooms.members.bulk_import_users').click();
    cy.get('.modal').should('be.visible').within(()=>{

      //Check role selection
      cy.get('[data-cy="roleSelection"]').within(()=>{

        //Check if texts are shown
        cy.get('.badge').should('have.length', 3).eq(0).contains('rooms.roles.participant');
        cy.get('.badge').eq(1).contains('rooms.roles.moderator');
        cy.get('.badge').eq(2).contains('rooms.roles.co_owner');

        //check if checkboxes exist and if the first one is checked
        cy.get('input').should('have.length', 3).eq(0).should('have.value', 1).and('be.checked');
        cy.get('input').eq(1).should('have.value', 2).and('not.be.checked');
        cy.get('input').eq(2).should('have.value', 3).and('not.be.checked');
      });

      cy.get('button').eq(1).as('firstStepButton');
      cy.get('@firstStepButton').should('contain.text', 'rooms.members.modals.add.add').should('be.disabled');

      // check if textarea exists, is empty and enter text
      cy.get('textarea').should('have.value', '').type('LauraWRivera@domain.tld\nLauraMWalter@domain.tld');

      //click on button (also checks if disabled)
      cy.get('@firstStepButton').click();
      //Todo
      //cy.get('@onImportedSpy').should('have.been.calledOnce');

      //check if list shows correctly
      cy.get('.list-group-item').should('have.length', 2).and('contain.class', 'list-group-item-success').eq(0).should('contain.text', 'laurawrivera@domain.tld');
      cy.get('.list-group-item').eq(1).should('contain.text', 'lauramwalter@domain.tld');
      cy.get('.badge').should('contain.text', 2);

      //check if button exists and shows the correct text, and close modal
      cy.get('button').eq(1).should('contain.text', 'app.close').click();

    });

    cy.get('.modal').should('not.exist');

    //check if modal opens again
    cy.get('@bulkImportButton').click();
    cy.get('.modal').should('be.visible').within(()=>{
      //check if button is disabled, textarea is empty and enter text
      cy.get('button').eq(1).should('be.disabled');
      cy.get('textarea').should('have.value', '').type('TammyGLaw@domain.tld');

      //click on button (also checks if disabled)
      cy.get('button').eq(1).click();
      // Todo
      // cy.get('@onImportedSpy').should('have.been.calledOnce');

      // check if list shows correctly
      cy.get('.list-group-item').should('have.length', 1).and('contain.class', 'list-group-item-success').should('contain.text', 'tammyglaw@domain.tld');
    });

  });
})
