import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';

describe('Room View general', function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
  });

  it('room view as guest', function () {
    cy.intercept('GET', 'api/v1/currentUser', {});
    cy.interceptRoomFilesRequest();
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        last_meeting: null,
        type: {
          id: 2,
          name: 'Meeting',
          color: '#4a5c66'
        },
        model_name: 'Room',
        short_description: null,
        is_favorite: false,
        authenticated: true,
        description: null,
        allow_membership: true,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        access_code: null,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: null
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    // Check that room Header is shown correctly
    cy.contains('Meeting One').should('be.visible');
    cy.contains('John Doe').should('be.visible');
    cy.contains('rooms.index.room_component.never_started').should('be.visible');

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should('be.visible');
    cy.get('[data-test="room-join-membership-button"]').should('not.exist');
    cy.get('[data-test="room-end-membership-button"]').should('not.exist');
    cy.get('[data-test="room-favorites-button"]').should('not.exist');

    // Check that tabs are shown correctly
    cy.get('#tab-description').should('not.exist');
    cy.get('#tab-members').should('not.exist');
    cy.get('#tab-tokens').should('not.exist');
    cy.get('#tab-files').should('be.visible');
    cy.get('#tab-recordings').should('be.visible');
    cy.get('#tab-history').should('not.exist');
    cy.get('#tab-settings').should('not.exist');

    // Check that correct tab is shown
    cy.contains('rooms.files.title').should('be.visible');

    // Check if share button is hidden
    cy.get('[data-test="room-share-button"]').should('not.exist');
  });

  it('room view as guest with access code', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 2,
          name: 'Max Doe'
        },
        last_meeting: null,
        type: {
          id: 2,
          name: 'Meeting',
          color: '#4a5c66'
        },
        model_name: 'Room',
        short_description: null,
        is_favorite: false,
        authenticated: false,
        description: '<p>Test</p>',
        allow_membership: true,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        access_code: null,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: {
          id: 1,
          firstname: 'John',
          lastname: 'Doe',
          locale: 'en',
          permissions: ['rooms.create'],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    cy.wait('@roomRequest');

    // Check that access code input is shown correctly

    cy.get('[data-test="room-access-code-overlay"]').should('be.visible').within(() => {
      cy.contains('Meeting One').should('be.visible');
      cy.contains('Max Doe').should('be.visible');
      cy.contains('rooms.index.room_component.never_started').should('be.visible');
      cy.contains('rooms.require_access_code').should('be.visible');

      cy.get('#access-code').type('123456789');
    });

    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 2,
          name: 'Max Doe'
        },
        last_meeting: null,
        type: {
          id: 2,
          name: 'Meeting',
          color: '#4a5c66'
        },
        model_name: 'Room',
        short_description: null,
        is_favorite: false,
        authenticated: true,
        description: '<p>Test</p>',
        allow_membership: true,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: {
          id: 1,
          firstname: 'John',
          lastname: 'Doe',
          locale: 'en',
          permissions: ['rooms.create'],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="room-login-button"]').click();

    cy.wait('@roomRequest').then((interception) => {
      expect(interception.request.headers['access-code']).to.eq('123456789');
    });

    cy.get('[data-test="room-access-code-overlay"]').should('not.exist');

    // Check that room Header is shown correctly
    cy.contains('Meeting One').should('be.visible');
    cy.contains('Max Doe').should('be.visible');
    cy.contains('rooms.index.room_component.never_started').should('be.visible');

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should('be.visible');
    cy.get('[data-test="room-join-membership-button"]').should('be.visible');
    cy.get('[data-test="room-end-membership-button"]').should('not.exist');
    cy.get('[data-test="room-favorites-button"]').should('be.visible');

    // Check that tabs are shown correctly
    cy.get('#tab-description').should('be.visible');
    cy.get('#tab-members').should('not.exist');
    cy.get('#tab-tokens').should('not.exist');
    cy.get('#tab-files').should('be.visible');
    cy.get('#tab-recordings').should('be.visible');
    cy.get('#tab-history').should('not.exist');
    cy.get('#tab-settings').should('not.exist');

    // Check that the correct tab is shown
    cy.contains('rooms.description.title').should('be.visible');

    // Check if share button is hidden
    cy.get('[data-test="room-share-button"]').should('not.exist');
  });

  it('room view as member', function () {
    cy.interceptRoomFilesRequest();
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 2,
          name: 'Max Doe'
        },
        last_meeting: null,
        type: {
          id: 2,
          name: 'Meeting',
          color: '#4a5c66'
        },
        model_name: 'Room',
        short_description: null,
        is_favorite: false,
        authenticated: true,
        description: null,
        allow_membership: true,
        is_member: true,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        access_code: 123456789,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: {
          id: 1,
          firstname: 'John',
          lastname: 'Doe',
          locale: 'en',
          permissions: ['rooms.create'],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    // Check that room Header is shown correctly
    cy.contains('Meeting One').should('be.visible');
    cy.contains('Max Doe').should('be.visible');
    cy.contains('rooms.index.room_component.never_started').should('be.visible');

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should('be.visible');
    cy.get('[data-test="room-join-membership-button"]').should('not.exist');
    cy.get('[data-test="room-end-membership-button"]').should('be.visible');
    cy.get('[data-test="room-favorites-button"]').should('be.visible');

    // Check that tabs are shown correctly
    cy.get('#tab-description').should('not.exist');
    cy.get('#tab-members').should('not.exist');
    cy.get('#tab-tokens').should('not.exist');
    cy.get('#tab-files').should('be.visible');
    cy.get('#tab-recordings').should('be.visible');
    cy.get('#tab-history').should('not.exist');
    cy.get('#tab-settings').should('not.exist');

    // Check that correct tab is shown
    cy.contains('rooms.files.title').should('be.visible');

    // Check if share button is hidden
    cy.get('[data-test="room-share-button"]').should('not.exist');
  });

  it('room view as moderator', function () {
    cy.interceptRoomFilesRequest();
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 2,
          name: 'Max Doe'
        },
        last_meeting: null,
        type: {
          id: 2,
          name: 'Meeting',
          color: '#4a5c66'
        },
        model_name: 'Room',
        short_description: null,
        is_favorite: false,
        authenticated: true,
        description: null,
        allow_membership: true,
        is_member: true,
        is_moderator: true,
        is_co_owner: false,
        can_start: true,
        access_code: 123456789,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: {
          id: 1,
          firstname: 'John',
          lastname: 'Doe',
          locale: 'en',
          permissions: ['rooms.create'],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    // Check that room Header is shown correctly
    cy.contains('Meeting One').should('be.visible');
    cy.contains('Max Doe').should('be.visible');
    cy.contains('rooms.index.room_component.never_started').should('be.visible');

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should('be.visible');
    cy.get('[data-test="room-join-membership-button"]').should('not.exist');
    cy.get('[data-test="room-end-membership-button"]').should('be.visible');
    cy.get('[data-test="room-favorites-button"]').should('be.visible');

    // Check that tabs are shown correctly
    cy.get('#tab-description').should('not.exist');
    cy.get('#tab-members').should('not.exist');
    cy.get('#tab-tokens').should('not.exist');
    cy.get('#tab-files').should('be.visible');
    cy.get('#tab-recordings').should('be.visible');
    cy.get('#tab-history').should('not.exist');
    cy.get('#tab-settings').should('not.exist');

    // Check that correct tab is shown
    cy.contains('rooms.files.title').should('be.visible');

    // Check if share button is shown correctly
    cy.get('[data-test="room-share-button"]').click();
    cy.get('#invitationLink').should('include.value', '/rooms/abc-def-123'); // ToDo think about adding baseUrl
    cy.get('#invitationCode').should('have.value', '123-456-789');

    cy.get('[data-test="room-copy-invitation-button"]').click();

    cy.get('.p-toast').should('be.visible').and('have.text', 'rooms.invitation.copied');

    // ToDo check if works always
    cy.window().then(win => {
      win.navigator.clipboard.readText().then(text => {
        expect(text).to.eq('rooms.invitation.room_{"roomname":"Meeting One"}\nrooms.invitation.link: undefined/rooms/abc-def-123\nrooms.invitation.code: 123-456-789');
      });
    });
  });

  it('room view as co-owner', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 2,
          name: 'Max Doe'
        },
        last_meeting: null,
        type: {
          id: 2,
          name: 'Meeting',
          color: '#4a5c66'
        },
        model_name: 'Room',
        short_description: null,
        is_favorite: false,
        authenticated: true,
        description: null,
        allow_membership: true,
        is_member: true,
        is_moderator: false,
        is_co_owner: true,
        can_start: true,
        access_code: 123456789,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: {
          id: 1,
          firstname: 'John',
          lastname: 'Doe',
          locale: 'en',
          permissions: ['rooms.create'],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    // Check that room Header is shown correctly
    cy.contains('Meeting One').should('be.visible');
    cy.contains('Max Doe').should('be.visible');
    cy.contains('rooms.index.room_component.never_started').should('be.visible');

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should('be.visible');
    cy.get('[data-test="room-join-membership-button"]').should('not.exist');
    cy.get('[data-test="room-end-membership-button"]').should('be.visible');
    cy.get('[data-test="room-favorites-button"]').should('be.visible');

    // Check that tabs are shown correctly
    cy.get('#tab-description').should('be.visible');
    cy.get('#tab-members').should('be.visible');
    cy.get('#tab-tokens').should('be.visible');
    cy.get('#tab-files').should('be.visible');
    cy.get('#tab-recordings').should('be.visible');
    cy.get('#tab-history').should('be.visible');
    cy.get('#tab-settings').should('be.visible');

    // Check that correct tab is shown
    cy.contains('rooms.description.title').should('be.visible');

    // Check if share button is shown correctly
    cy.get('[data-test="room-share-button"]').click();
    cy.get('#invitationLink').should('include.value', '/rooms/abc-def-123');
    cy.get('#invitationCode').should('have.value', '123-456-789');
  });

  it('room view as owner', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        last_meeting: null,
        type: {
          id: 2,
          name: 'Meeting',
          color: '#4a5c66'
        },
        model_name: 'Room',
        short_description: null,
        is_favorite: false,
        authenticated: true,
        description: null,
        allow_membership: true,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        access_code: 123456789,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: {
          id: 1,
          firstname: 'John',
          lastname: 'Doe',
          locale: 'en',
          permissions: ['rooms.create'],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    // Check that room Header is shown correctly
    cy.contains('Meeting One').should('be.visible');
    cy.contains('John Doe').should('be.visible');
    cy.contains('rooms.index.room_component.never_started').should('be.visible');

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should('be.visible');
    cy.get('[data-test="room-join-membership-button"]').should('not.exist');
    cy.get('[data-test="room-end-membership-button"]').should('not.exist');
    cy.get('[data-test="room-favorites-button"]').should('be.visible');

    // Check that tabs are shown correctly
    cy.get('#tab-description').should('be.visible');
    cy.get('#tab-members').should('be.visible');
    cy.get('#tab-tokens').should('be.visible');
    cy.get('#tab-files').should('be.visible');
    cy.get('#tab-recordings').should('be.visible');
    cy.get('#tab-history').should('be.visible');
    cy.get('#tab-settings').should('be.visible');

    // Check that correct tab is shown
    cy.contains('rooms.description.title').should('be.visible');

    // Check if share button is shown correctly
    cy.get('[data-test="room-share-button"]').click();
    cy.get('#invitationLink').should('include.value', '/rooms/abc-def-123');
    cy.get('#invitationCode').should('have.value', '123-456-789');
  });

  it('room view with token (participant)', function () {
    cy.intercept('GET', 'api/v1/currentUser', {});
    cy.interceptRoomFilesRequest();
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        last_meeting: null,
        type: {
          id: 2,
          name: 'Meeting',
          color: '#4a5c66'
        },
        model_name: 'Room',
        short_description: null,
        is_favorite: false,
        authenticated: true,
        description: null,
        allow_membership: true,
        is_member: true,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        access_code: 123456789,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: null
      }
    }).as('roomRequest');

    // Visit room with token
    cy.visit('/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');

    // Check that header for token is set
    cy.wait('@roomRequest').then((interception) => {
      expect(interception.request.headers.token).to.eq('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    });

    // Check that room Header is shown correctly
    cy.contains('Meeting One').should('be.visible');
    cy.contains('John Doe').should('be.visible');
    cy.contains('rooms.index.room_component.never_started').should('be.visible');

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should('be.visible');
    cy.get('[data-test="room-join-membership-button"]').should('not.exist');
    cy.get('[data-test="room-end-membership-button"]').should('not.exist');
    cy.get('[data-test="room-favorites-button"]').should('not.exist');

    // Check that tabs are shown correctly
    cy.get('#tab-description').should('not.exist');
    cy.get('#tab-members').should('not.exist');
    cy.get('#tab-tokens').should('not.exist');
    cy.get('#tab-files').should('be.visible');
    cy.get('#tab-recordings').should('be.visible');
    cy.get('#tab-history').should('not.exist');
    cy.get('#tab-settings').should('not.exist');

    // Check that correct tab is shown
    cy.contains('rooms.files.title').should('be.visible');

    // Check if share button is hidden
    cy.get('[data-test="room-share-button"]').should('not.exist');
  });

  it('room view with token (moderator)', function () {
    cy.intercept('GET', 'api/v1/currentUser', {});
    cy.interceptRoomFilesRequest();
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        last_meeting: null,
        type: {
          id: 2,
          name: 'Meeting',
          color: '#4a5c66'
        },
        model_name: 'Room',
        short_description: null,
        is_favorite: false,
        authenticated: true,
        description: null,
        allow_membership: true,
        is_member: true,
        is_moderator: true,
        is_co_owner: false,
        can_start: true,
        access_code: 123456789,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: null
      }
    }).as('roomRequest');

    // Visit room with token
    cy.visit('/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');

    // Check that header for token is set
    cy.wait('@roomRequest').then((interception) => {
      expect(interception.request.headers.token).to.eq('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    });

    // Check that room Header is shown correctly
    cy.contains('Meeting One').should('be.visible');
    cy.contains('John Doe').should('be.visible');
    cy.contains('rooms.index.room_component.never_started').should('be.visible');

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should('be.visible');
    cy.get('[data-test="room-join-membership-button"]').should('not.exist');
    cy.get('[data-test="room-end-membership-button"]').should('not.exist');
    cy.get('[data-test="room-favorites-button"]').should('not.exist');

    // Check that tabs are shown correctly
    cy.get('#tab-description').should('not.exist');
    cy.get('#tab-members').should('not.exist');
    cy.get('#tab-tokens').should('not.exist');
    cy.get('#tab-files').should('be.visible');
    cy.get('#tab-recordings').should('be.visible');
    cy.get('#tab-history').should('not.exist');
    cy.get('#tab-settings').should('not.exist');

    // Check that correct tab is shown
    cy.contains('rooms.files.title').should('be.visible');

    // Check if share button is hidden
    cy.get('[data-test="room-share-button"]').should('not.exist');
  });

  it('room view with rooms.viewAll permission', function () {
    cy.intercept('GET', 'api/v1/currentUser', {
      statusCode: 200,
      body: {
        data: {
          id: 1,
          firstname: 'John',
          lastname: 'Doe',
          locale: 'en',
          permissions: ['rooms.viewAll'],
          model_name: 'User',
          room_limit: -1
        }
      }
    });

    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 2,
          name: 'Max Doe'
        },
        last_meeting: null,
        type: {
          id: 2,
          name: 'Meeting',
          color: '#4a5c66'
        },
        model_name: 'Room',
        short_description: null,
        is_favorite: false,
        authenticated: true,
        description: null,
        allow_membership: true,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        access_code: 123456789,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: {
          id: 1,
          firstname: 'John',
          lastname: 'Doe',
          locale: 'en',
          permissions: ['rooms.viewAll'],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    // Check that room Header is shown correctly
    cy.contains('Meeting One').should('be.visible');
    cy.contains('Max Doe').should('be.visible');
    cy.contains('rooms.index.room_component.never_started').should('be.visible');

    // Check that buttons are shown correctly
    cy.get('[data-test="reload-room-button"]').should('be.visible');
    cy.get('[data-test="room-join-membership-button"]').should('be.visible');
    cy.get('[data-test="room-end-membership-button"]').should('not.exist');
    cy.get('[data-test="room-favorites-button"]').should('be.visible');

    // Check that tabs are shown correctly
    cy.get('#tab-description').should('be.visible');
    cy.get('#tab-members').should('be.visible');
    cy.get('#tab-tokens').should('be.visible');
    cy.get('#tab-files').should('be.visible');
    cy.get('#tab-recordings').should('be.visible');
    cy.get('#tab-history').should('be.visible');
    cy.get('#tab-settings').should('be.visible');

    // Check that correct tab is shown
    cy.contains('rooms.description.title').should('be.visible');

    // Check if share button is shown correctly
    cy.get('[data-test="room-share-button"]').click();
    cy.get('#invitationLink').should('include.value', '/rooms/abc-def-123');
    cy.get('#invitationCode').should('have.value', '123-456-789');
  });

  it('guest forbidden', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 403,
      body: {
        message: 'guests_not_allowed'
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    cy.wait('@roomRequest');
    // Check that the error message is shown
    cy.contains('rooms.only_used_by_authenticated_users').should('be.visible');

    // Get reload button and reload without error
    const reloadRequest = interceptIndefinitely('GET', 'api/v1/rooms/abc-def-123', { fixture: 'exampleRoom.json' }, 'roomRequest');
    cy.get('[data-test="reload-room-button"]').click();
    cy.get('[data-test="reload-room-button"]').should('be.disabled').then(() => {
      reloadRequest.sendResponse();
    });

    cy.wait('@roomRequest');
    cy.contains('Meeting One').should('be.visible');
  });

  it('test error', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    });

    cy.visit('/rooms/abc-def-123');
    cy.get('.p-toast')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}');

    // Get reload button and reload without error
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', { fixture: 'exampleRoom.json' }).as('roomRequest');
    cy.get('[data-test="reload-button"]').eq(0).should('have.text', 'app.reload').click();

    cy.wait('@roomRequest');
    cy.contains('Meeting One').should('be.visible');
  });

  it('room not found', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 404,
      body: {
        message: 'No query results for model [App\\Room] abc-def-123'
      }
    });

    cy.visit('/rooms/abc-def-123');

    cy.url().should('include', '/404').should('not.include', '/rooms/abc-def-123');
  });
});
