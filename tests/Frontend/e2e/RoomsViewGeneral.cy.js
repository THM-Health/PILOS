import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';

describe('Room View general', function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();

    cy.intercept('GET', 'api/v1/config', {
      data: {
        general: {
          name: 'PILOS Test',
          toast_lifetime: 0
        },
        theme: { primary_color: '#14b8a6', rounded: true },
        room: { refresh_rate: 5000 }
      }
    });
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

    cy.title().should('eq', 'Meeting One - PILOS Test');

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

    // Test reloading the room
    const reloadRequest = interceptIndefinitely('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting Two',
        owner: {
          id: 2,
          name: 'Max Doe'
        },
        last_meeting: {
          start: '2023-08-21 08:18:28:00',
          end: null
        },
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
        access_code: null,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: null
      }
    }, 'roomRequest');

    // Trigger reload
    cy.get('[data-test="reload-room-button"]').click();
    cy.get('[data-test="reload-room-button"]').should('be.disabled').then(() => {
      reloadRequest.sendResponse();
    });

    cy.title().should('eq', 'Meeting Two - PILOS Test');

    // Check that room Header is shown correctly
    cy.contains('Meeting Two').should('be.visible');
    cy.contains('Max Doe').should('be.visible');
    cy.contains('rooms.index.room_component.running_since_{"date":"08/21/2023, 08:18"}').should('be.visible');

    // Check that tabs are shown correctly
    cy.get('#tab-description').should('be.visible');
    cy.get('#tab-members').should('not.exist');
    cy.get('#tab-tokens').should('not.exist');
    cy.get('#tab-files').should('be.visible');
    cy.get('#tab-recordings').should('be.visible');
    cy.get('#tab-history').should('not.exist');
    cy.get('#tab-settings').should('not.exist');
  });

  it('room view with access code', function () {
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
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    cy.wait('@roomRequest');

    cy.title().should('eq', 'Meeting One - PILOS Test');

    // Check that access code input is shown correctly
    cy.get('[data-test="room-access-code-overlay"]').should('be.visible').within(() => {
      cy.contains('Meeting One').should('be.visible');
      cy.contains('Max Doe').should('be.visible');
      cy.contains('rooms.index.room_component.never_started').should('be.visible');
      cy.contains('rooms.require_access_code').should('be.visible');

      // Try to submit invalid access code
      cy.get('[data-test="room-access-code"] input').type('987654321'); // ToDo change back to #access-code
    });

    // Intercept first request to respond with error
    const errorRoomRequest = interceptIndefinitely('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 401,
      body: {
        message: 'invalid_code'
      }
    }, 'roomRequest');

    cy.get('[data-test="room-login-button"]').click();

    // Intercept second request (reload room) and send response of the first request
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
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest').then(() => {
      errorRoomRequest.sendResponse();
    });

    // Wait for first request and check if access code gets set
    cy.wait('@roomRequest').then((interception) => {
      expect(interception.request.headers['access-code']).to.eq('987654321');
    });

    // Wait for second request
    cy.wait('@roomRequest');

    // Check if error message is shown
    cy.get('.p-toast-message')
      .should('be.visible')
      .and('have.text', 'rooms.flash.access_code_invalid')
      .find('button').click();
    cy.get('.p-toast-message').should('not.exist');

    cy.contains('rooms.flash.access_code_invalid').should('be.visible');

    // Submit correct access code
    cy.get('[data-test="room-access-code-overlay"]').should('be.visible').within(() => {
      cy.get('[data-test="room-access-code"] input').type('123456789'); // ToDo change back to #access-code
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
          permissions: [],
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

    // Reload with invalid access code
    const errorReloadRoomRequest = interceptIndefinitely('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 401,
      body: {
        message: 'invalid_code'
      }
    }, 'roomRequest');

    cy.get('[data-test="reload-room-button"]').click();

    // Intercept second request (reload room) and send response of the first request
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
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest').then(() => {
      errorReloadRoomRequest.sendResponse();
    });

    // Check if error message is shown
    cy.get('.p-toast-message')
      .should('be.visible')
      .and('have.text', 'rooms.flash.access_code_invalid');

    cy.contains('rooms.flash.access_code_invalid').should('be.visible');

    cy.get('[data-test="room-access-code-overlay"]').should('be.visible');
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
        last_meeting: {
          start: '2023-08-21 08:18:28:00',
          end: '2023-08-21 08:20:28:00'
        },
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
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    cy.title().should('eq', 'Meeting One - PILOS Test');

    // Check that room Header is shown correctly
    cy.contains('Meeting One').should('be.visible');
    cy.contains('Max Doe').should('be.visible');
    cy.contains('rooms.index.room_component.last_ran_till_{"date":"08/21/2023, 08:20"}').should('be.visible');

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
    cy.intercept('GET', 'api/v1/config', {
      data: {
        general: {
          name: 'PILOS Test',
          toast_lifetime: 0,
          base_url: 'testUrl'
        },
        theme: { primary_color: '#14b8a6', rounded: true },
        room: { refresh_rate: 5000 }
      }
    });
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
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    cy.title().should('eq', 'Meeting One - PILOS Test');

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
    cy.get('#invitationLink').should('have.value', 'testUrl/rooms/abc-def-123');
    cy.get('#invitationCode').should('have.value', '123-456-789');

    cy.get('[data-test="room-copy-invitation-button"]').click();

    cy.get('.p-toast-message').should('be.visible').and('have.text', 'rooms.invitation.copied');

    // ToDo check if this always works
    cy.window().then(win => {
      win.navigator.clipboard.readText().then(text => {
        expect(text).to.eq('rooms.invitation.room_{"roomname":"Meeting One","platform":"PILOS Test"}\nrooms.invitation.link: testUrl/rooms/abc-def-123\nrooms.invitation.code: 123-456-789');
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
        last_meeting: {
          start: '2023-08-21 08:18:28:00',
          end: null
        },
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
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    cy.title().should('eq', 'Meeting One - PILOS Test');

    // Check that room Header is shown correctly
    cy.contains('Meeting One').should('be.visible');
    cy.contains('Max Doe').should('be.visible');
    cy.contains('rooms.index.room_component.running_since_{"date":"08/21/2023, 08:18"}').should('be.visible');

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

    cy.title().should('eq', 'Meeting One - PILOS Test');

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
        username: 'Max Doe',
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

    cy.title().should('eq', 'Meeting One - PILOS Test');

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

    // Reload with invalid token
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 401,
      body: {
        message: 'invalid_token'
      }
    }).as('roomRequest');

    cy.get('[data-test="reload-room-button"]').click();

    // Check that error message is shown
    cy.get('.p-toast-message').should('be.visible').and('have.text', 'rooms.flash.token_invalid');
    cy.contains('rooms.invalid_personal_link').should('be.visible');
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
        username: 'Max Doe',
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

    cy.title().should('eq', 'Meeting One - PILOS Test');

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

    cy.title().should('eq', 'Meeting One - PILOS Test');

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

  it('membership button', function () {
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
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    cy.wait('@roomRequest');

    cy.get('[data-test="room-access-code-overlay"]').should('be.visible');
    cy.get('[data-test="room-access-code"] input').type('123456789'); // ToDo change back to #access-code

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
          permissions: [],
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

    // Test join membership with general error
    cy.intercept('POST', 'api/v1/rooms/abc-def-123/membership', {
      statusCode: 500,
      body: {
        message: 'Test join membership error'
      }
    }).as('joinMembershipRequest');

    cy.get('[data-test="room-join-membership-button"]').click();

    cy.wait('@joinMembershipRequest').then((interception) => {
      expect(interception.request.headers['access-code']).to.eq('123456789');
    });

    // Check if error message is shown and close it
    cy.get('.p-toast-message')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test join membership error"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}')
      .find('button').click();
    cy.get('.p-toast-message').should('not.exist');

    // Test join membership
    const joinMembershipRequest = interceptIndefinitely('POST', 'api/v1/rooms/abc-def-123/membership', {
      statusCode: 204
    }, 'joinMembershipRequest');

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
        is_member: true,
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
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="room-end-membership-button"]').should('not.exist');
    cy.get('[data-test="room-join-membership-button"]').click();
    cy.get('[data-test="room-join-membership-button"]').should('be.disabled').then(() => {
      joinMembershipRequest.sendResponse();
    });

    cy.wait('@joinMembershipRequest').then((interception) => {
      expect(interception.request.headers['access-code']).to.eq('123456789');
    });

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.headers['access-code']).to.be.undefined;
    });

    cy.get('[data-test="room-join-membership-button"]').should('not.exist');
    cy.get('[data-test="room-end-membership-button"]').should('be.visible');

    // Test end membership with general error
    cy.intercept('DELETE', 'api/v1/rooms/abc-def-123/membership', {
      statusCode: 500,
      body: {
        message: 'Test end membership error'
      }
    }).as('endMembershipRequest');

    cy.get('[data-test="room-end-membership-button"]').click();

    cy.get('[data-test="end-membership-dialog"]').should('be.visible');
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait('@endMembershipRequest').then((interception) => {
      expect(interception.request.headers['access-code']).to.be.undefined;
    });

    // Check if error message is shown and close it
    cy.get('.p-toast-message')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test end membership error"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}')
      .find('button').click();
    cy.get('.p-toast-message').should('not.exist');

    // Close end membership dialog
    cy.get('[data-test="end-membership-dialog"]').should('be.visible');
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="end-membership-dialog"]').should('not.exist');

    // Test end membership
    const endMembershipRequest = interceptIndefinitely('DELETE', 'api/v1/rooms/abc-def-123/membership', {
      statusCode: 204
    }, 'endMembershipRequest');

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
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: {
          id: 1,
          firstname: 'John',
          lastname: 'Doe',
          locale: 'en',
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="room-end-membership-button"]').click();

    cy.get('[data-test="end-membership-dialog"]').should('be.visible');
    cy.get('[data-test="dialog-continue-button"]').click();
    cy.get('[data-test="dialog-continue-button"]').should('be.disabled').then(() => {
      endMembershipRequest.sendResponse();
    });

    cy.wait('@endMembershipRequest').then((interception) => {
      expect(interception.request.headers['access-code']).to.be.undefined;
    });

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.headers['access-code']).to.be.undefined;
    });

    cy.get('[data-test="room-access-code-overlay"]').should('be.visible');
    cy.get('[data-test="room-access-code"] input').should('have.value', '123-456-789'); // ToDo change back to #access-code
  });

  it('join membership invalid code', function () {
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
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    cy.wait('@roomRequest');

    cy.get('[data-test="room-access-code-overlay"]').should('be.visible');
    cy.get('[data-test="room-access-code"] input').type('123456789'); // ToDo change back to #access-code

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
          permissions: [],
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

    // Test join membership with invalid code error
    cy.intercept('POST', 'api/v1/rooms/abc-def-123/membership', {
      statusCode: 401,
      body: {
        message: 'invalid_code'
      }
    }).as('membershipRequest');

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
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: {
          id: 1,
          firstname: 'John',
          lastname: 'Doe',
          locale: 'en',
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="room-join-membership-button"]').click();

    cy.wait('@membershipRequest');
    cy.wait('@roomRequest');

    // Check if error message is shown
    cy.get('[data-test="room-access-code-overlay"]').should('be.visible');
    cy.get('.p-toast-message')
      .should('be.visible')
      .and('have.text', 'rooms.flash.access_code_invalid')
      .find('button').click();
    cy.get('.p-toast-message').should('not.exist');

    cy.contains('rooms.flash.access_code_invalid').should('be.visible');
  });

  it('join membership but membership not available', function () {
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
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    cy.wait('@roomRequest');

    cy.get('[data-test="room-access-code-overlay"]').should('be.visible');
    cy.get('[data-test="room-access-code"] input').type('123456789'); // ToDo change back to #access-code

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
          permissions: [],
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

    // Test join membership with membership not available
    cy.intercept('POST', 'api/v1/rooms/abc-def-123/membership', {
      statusCode: 403,
      body: {
        message: 'Membership failed! Membership for this room is currently not available.'
      }
    }).as('membershipRequest');

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
        allow_membership: false,
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
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="room-join-membership-button"]').click();

    cy.wait('@membershipRequest');
    cy.wait('@roomRequest');

    // Check if error message is shown and close ii
    cy.get('.p-toast-message')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Membership failed! Membership for this room is currently not available."}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":403}');

    cy.get('[data-test="room-login-button"]').should('not.exist');
  });

  it('favorites button', function () {
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
        access_code: null,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: {
          id: 1,
          firstname: 'John',
          lastname: 'Doe',
          locale: 'en',
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    cy.wait('@roomRequest');

    // Test add room to favorites with general error
    cy.intercept('POST', 'api/v1/rooms/abc-def-123/favorites', {
      statusCode: 500,
      body: {
        message: 'Test add favorite error'
      }
    }).as('addFavoritesRequest');

    cy.get('[data-test="room-favorites-button"]').click();

    cy.wait('@addFavoritesRequest');
    cy.wait('@roomRequest');

    // Check that error message is shown and button stayed the same
    cy.get('.p-toast-message')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test add favorite error"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}')
      .find('button').click();
    cy.get('.p-toast-message').should('not.exist');

    cy.get('[data-test="room-favorites-button"]').should('have.attr', 'aria-label', 'rooms.favorites.add');

    // Test add room to favorites
    const addToFavoritesRequest = interceptIndefinitely('POST', 'api/v1/rooms/abc-def-123/favorites', {
      statusCode: 204
    }, 'addFavoritesRequest');
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
        is_favorite: true,
        authenticated: true,
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
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="room-favorites-button"]').should('have.attr', 'aria-label', 'rooms.favorites.add');
    cy.get('[data-test="room-favorites-button"]').click();
    cy.get('[data-test="room-favorites-button"]').should('be.disabled').then(() => {
      addToFavoritesRequest.sendResponse();
    });

    cy.wait('@addFavoritesRequest');
    cy.wait('@roomRequest');

    // Check that button is changed to remove from favorites
    cy.get('[data-test="room-favorites-button"]').should('have.attr', 'aria-label', 'rooms.favorites.remove');

    // Test remove room from favorites with general error
    cy.intercept('DELETE', 'api/v1/rooms/abc-def-123/favorites', {
      statusCode: 500,
      body: {
        message: 'Test remove favorite error'
      }
    }).as('deleteFavoritesRequest');

    cy.get('[data-test="room-favorites-button"]').click();

    cy.wait('@deleteFavoritesRequest');
    cy.wait('@roomRequest');

    // Check that error message is shown and button stayed the same
    cy.get('.p-toast-message')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test remove favorite error"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}')
      .find('button').click();
    cy.get('.p-toast-message').should('not.exist');

    cy.get('[data-test="room-favorites-button"]').should('have.attr', 'aria-label', 'rooms.favorites.remove');

    // Test remove room from favorites
    const deleteFromFavorites = interceptIndefinitely('DELETE', 'api/v1/rooms/abc-def-123/favorites', {
      statusCode: 204
    }, 'deleteFavoritesRequest');

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
        access_code: null,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: {
          id: 1,
          firstname: 'John',
          lastname: 'Doe',
          locale: 'en',
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="room-favorites-button"]').click();
    cy.get('[data-test="room-favorites-button"]').should('be.disabled').then(() => {
      deleteFromFavorites.sendResponse();
    });

    cy.wait('@deleteFavoritesRequest');
    cy.wait('@roomRequest');

    // Check that button is changed to add to favorites
    cy.get('[data-test="room-favorites-button"]').should('have.attr', 'aria-label', 'rooms.favorites.add');
  });

  it('visit with guest forbidden', function () {
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

  it('visit with token as authenticated user', function () {
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
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    }).as('roomRequest');

    // Visit room with token
    cy.visit('/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');

    // Check that error message is shown and user is redirected to the home page
    cy.get('.p-toast-message').should('be.visible').and('have.text', 'app.flash.guests_only');
    cy.url().should('not.include', '/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
  });

  it('visit with invalid token', function () {
    cy.intercept('GET', 'api/v1/currentUser', {});
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 401,
      body: {
        message: 'invalid_token'
      }
    }).as('roomRequest');

    // Visit room with token
    cy.visit('/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');

    // Check that error message is shown
    cy.contains('rooms.invalid_personal_link').should('be.visible');
  });

  it('visit with general error', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    });

    cy.visit('/rooms/abc-def-123');
    cy.get('.p-toast-message')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}');

    // Get reload button and reload without error
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', { fixture: 'exampleRoom.json' }).as('roomRequest');
    cy.get('[data-test="reload-button"]').eq(0).should('have.text', 'app.reload').click();

    cy.wait('@roomRequest');
    cy.contains('Meeting One').should('be.visible');
  });

  it('visit with room not found', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 404,
      body: {
        message: 'No query results for model [App\\Room] abc-def-123'
      }
    });

    cy.visit('/rooms/abc-def-123');

    cy.url().should('include', '/404').should('not.include', '/rooms/abc-def-123');
  });

  it('reload with errors', function () {
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
    cy.wait('@roomRequest');
    cy.contains('Meeting One').should('be.visible');

    // Test reload with guests forbidden
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 403,
      body: {
        message: 'guests_not_allowed'
      }
    }).as('roomRequest');

    cy.get('[data-test="reload-room-button"]').click();

    cy.wait('@roomRequest');
    // Check that the error message is shown
    cy.contains('rooms.only_used_by_authenticated_users').should('be.visible');

    // Test reload with general error
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('roomRequest');

    cy.get('[data-test="reload-room-button"]').click();
    cy.wait('@roomRequest');

    cy.get('.p-toast-message')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}');

    // Test reload with room not found
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      statusCode: 404,
      body: {
        message: 'No query results for model [App\\Room] abc-def-123'
      }
    }).as('roomRequest');

    cy.get('[data-test="reload-room-button"]').click();
    cy.wait('@roomRequest');

    cy.url().should('include', '/404').should('not.include', '/rooms/abc-def-123');
  });

  it('logged in status change', function () {
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

    // Check that tabs are shown correctly
    cy.get('#tab-description').should('be.visible');
    cy.get('#tab-members').should('be.visible');
    cy.get('#tab-tokens').should('be.visible');
    cy.get('#tab-files').should('be.visible');
    cy.get('#tab-recordings').should('be.visible');
    cy.get('#tab-history').should('be.visible');
    cy.get('#tab-settings').should('be.visible');

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

    cy.get('[data-test="reload-room-button"]').click();

    // Check that tabs are shown correctly
    cy.get('#tab-description').should('not.exist');
    cy.get('#tab-members').should('not.exist');
    cy.get('#tab-tokens').should('not.exist');
    cy.get('#tab-files').should('be.visible');
    cy.get('#tab-recordings').should('be.visible');
    cy.get('#tab-history').should('not.exist');
    cy.get('#tab-settings').should('not.exist');

    // ToDo co-owner and moderator also needed??
  });
});
