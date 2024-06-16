import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';

describe('Rooms view meetings', function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
  });

  it('join running meeting', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        last_meeting: { start: '2023-08-21 08:18:28:00', end: null },
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
        allow_membership: false,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        access_code: 508307005,
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
    });

    const joinRequest = interceptIndefinitely('GET', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 200,
      body: {
        url: 'http://example.org/?foo=a&bar=b'
      }
    }, 'joinRequest');

    cy.visit('/rooms/abc-def-123');

    // Check that room join dialog is closed and click on join button
    cy.get('[data-test=room-join-dialog]').should('not.exist');
    cy.get('[data-test=room-join-button]').should('not.be.disabled').and('have.text', 'rooms.join').click();

    // Test loading
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(()=>{
      cy.get('.p-button').eq(0).should('have.text', 'app.cancel').and('be.disabled');
      cy.get('.p-button').eq(1).should('have.text', 'app.continue').and('be.disabled');
    });
    cy.get('[data-test=room-join-button]').should('be.disabled').then(() => {
      joinRequest.sendResponse();
    });

    // Check that correct query is sent
    cy.wait('@joinRequest').then((interception) => {
      expect(interception.request.query).to.contain({
        name: '',
        record_attendance: '0',
        record: '0',
        record_video: '0'
      });
    });

    // Check if redirect worked
    cy.origin('http://example.org', () => {
      cy.url().should('eq', 'http://example.org/?foo=a&bar=b');
    });
  });

  it('join meeting error', function () { // ToDo improve error tests
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        last_meeting: { start: '2023-08-21 08:18:28:00', end: null },
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
        allow_membership: false,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        access_code: 508307005,
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

    // test guests not allowed
    cy.intercept('GET', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 403,
      body: {
        message: 'guests_not_allowed'
      }
    }).as('joinRequest');

    cy.visit('/rooms/abc-def-123');
    cy.wait('@roomRequest');

    cy.get('[data-test=room-join-button]').should('have.text', 'rooms.join').click();

    cy.wait('@joinRequest');

    // Check if error message is shown
    cy.contains('rooms.only_used_by_authenticated_users').should('be.visible');

    // Reload room
    cy.get('.p-button').should('have.text', 'rooms.try_again').click();

    cy.wait('@roomRequest');
    // test invalid access token (invalid_code)
    // ToDo improve test reset of access code (separate test??)
    cy.intercept('GET', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 401,
      body: {
        message: 'invalid_code'
      }
    }).as('joinRequest');

    cy.get('[data-test=room-join-button]').click();

    cy.wait('@joinRequest');
    cy.wait('@roomRequest');

    // Check if error message is shown and close it
    cy.get('.p-toast').should('be.visible').and('have.text', 'rooms.flash.access_code_invalid').find('button').click();

    // test invalid access token (require_code)
    // ToDo improve test reset of access code (separate test??)
    cy.intercept('GET', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 403,
      body: {
        message: 'require_code'
      }
    }).as('joinRequest');

    cy.get('[data-test=room-join-button]').click();

    cy.wait('@joinRequest');
    cy.wait('@roomRequest');

    // Check if error message is shown and close it
    cy.get('.p-toast').should('be.visible').and('have.text', 'rooms.flash.access_code_invalid').find('button').click();

    // test invalid token
    // ToDo improve test (move to other test case)
    cy.intercept('GET', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 401,
      body: {
        message: 'invalid_token'
      }
    }).as('joinRequest');

    cy.get('[data-test=room-join-button]').click();

    cy.wait('@joinRequest');

    // Check if error message is shown
    cy.get('.p-toast').should('be.visible').and('have.text', 'rooms.flash.token_invalid').find('button').click();
    cy.contains('rooms.invalid_personal_link').should('be.visible');
    // ToDo think about adding other errors directly after this or in a new test case
  });

  it('join meeting errors missing agreements', function () { // ToDo improve
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        last_meeting: { start: '2023-08-21 08:18:28:00', end: null },
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
        allow_membership: false,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        access_code: 508307005,
        room_type_invalid: false,
        record_attendance: true,
        record: true,
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

    cy.intercept('GET', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 470,
      body: {
        message: 'Consent to record attendance is required.'
      }
    }).as('joinRequest');

    cy.visit('/rooms/abc-def-123');
    cy.wait('@roomRequest');

    cy.get('[data-test=room-join-dialog]').should('not.exist');

    cy.get('[data-test=room-join-button]').click();

    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      // Test join with missing record attendance agreement
      cy.get('#record-agreement').click();
      cy.get('.p-button').eq(1).should('have.text', 'app.continue').click();

      cy.wait('@joinRequest');

      cy.contains('Consent to record attendance is required.').should('be.visible');

      // Test join with missing record agreement
      cy.get('#record-agreement').click();
      cy.get('#record-attendance-agreement').click();

      cy.intercept('GET', '/api/v1/rooms/abc-def-123/join*', {
        statusCode: 473,
        body: {
          message: 'Consent to the recording is required.'
        }
      }).as('joinRequest');

      cy.get('.p-button').eq(1).click();

      cy.wait('@joinRequest');

      cy.contains('Consent to record attendance is required.').should('not.exist');
      cy.contains('Consent to the recording is required.').should('be.visible');

      cy.get('.p-button').eq(0).should('have.text', 'app.cancel').click();
    });

    cy.get('[data-test=room-join-dialog]').should('not.exist');
  });

  it('join meeting error room closed', function () { // ToDo improve and maybe put together with other tests
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        last_meeting: { start: '2023-08-21 08:18:28:00', end: null },
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
        allow_membership: false,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        access_code: 508307005,
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

    cy.intercept('GET', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 460,
      body: {
        message: 'Joining failed! The room is currently closed.'
      }
    }).as('joinRequest');

    cy.visit('/rooms/abc-def-123');
    cy.wait('@roomRequest');

    // Intercept reload request and try to join room
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', { fixture: 'exampleRoom.json' }).as('reloadRequest');

    cy.get('[data-test=room-join-button]').click();

    cy.wait('@joinRequest');
    cy.wait('@reloadRequest');

    // Check if error message is shown and button has switched to start room
    cy.get('.p-toast').should('be.visible').and('have.text', 'app.errors.not_running');

    cy.get('[data-test=room-join-button]').should('not.exist');
    cy.get('[data-test=room-start-button]').should('have.text', 'rooms.start');
  });

  it('start meeting', function () {
    const startRequest = interceptIndefinitely('GET', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 200,
      body: {
        url: 'http://example.org/?foo=a&bar=b'
      }
    }, 'startRequest');

    cy.visit('/rooms/abc-def-123');

    cy.get('[data-test=room-start-button]').should('not.be.disabled').and('have.text', 'rooms.start').click();
    cy.get('[data-test=room-start-button]').should('be.disabled').then(() => {
      startRequest.sendResponse();
    });

    cy.wait('@startRequest').then((interception) => {
      expect(interception.request.query).to.contain({
        name: '',
        record_attendance: '0',
        record: '0',
        record_video: '0'
      });
    });

    cy.origin('http://example.org', () => {
      cy.url().should('eq', 'http://example.org/?foo=a&bar=b');
    });
  });

  it('start meeting errors', function () {
    // test guests not allowed
    cy.intercept('GET', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 403,
      body: {
        message: 'guests_not_allowed'
      }
    }).as('startRequest');

    cy.visit('/rooms/abc-def-123');
    cy.wait('@roomRequest');

    cy.get('[data-test=room-start-button]').should('have.text', 'rooms.start').click();

    cy.wait('@startRequest');

    // Check if error message is shown
    cy.contains('rooms.only_used_by_authenticated_users').should('be.visible');

    // Reload room
    cy.get('.p-button').should('have.text', 'rooms.try_again').click();

    cy.wait('@roomRequest');
    // test invalid access token (invalid_code)
    // ToDo improve test reset of access code (separate test??)
    cy.intercept('GET', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 401,
      body: {
        message: 'invalid_code'
      }
    }).as('startRequest');

    cy.get('[data-test=room-start-button]').click();

    cy.wait('@startRequest');
    cy.wait('@roomRequest');

    // Check if error message is shown and close it
    cy.get('.p-toast').should('be.visible').and('have.text', 'rooms.flash.access_code_invalid').find('button').click();

    // test invalid access token (require_code)
    // ToDo improve test reset of access code (separate test??)
    cy.intercept('GET', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 403,
      body: {
        message: 'require_code'
      }
    }).as('startRequest');

    cy.get('[data-test=room-start-button]').click();

    cy.wait('@startRequest');
    cy.wait('@roomRequest');

    // Check if error message is shown and close it
    cy.get('.p-toast').should('be.visible').and('have.text', 'rooms.flash.access_code_invalid').find('button').click();

    // test invalid token
    // ToDo improve test (move to other test case)
    cy.intercept('GET', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 401,
      body: {
        message: 'invalid_token'
      }
    }).as('startRequest');

    cy.get('[data-test=room-start-button]').click();

    cy.wait('@startRequest');

    // Check if error message is shown
    cy.get('.p-toast').should('be.visible').and('have.text', 'rooms.flash.token_invalid').find('button').click();
    cy.contains('rooms.invalid_personal_link').should('be.visible');
    // ToDo think about adding other errors directly after this or in a new test case
  });

  it('start meeting errors missing agreements', function () {
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
        allow_membership: false,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        access_code: 508307005,
        room_type_invalid: false,
        record_attendance: true,
        record: true,
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

    cy.intercept('GET', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 470,
      body: {
        message: 'Consent to record attendance is required.'
      }
    }).as('startRequest');

    cy.visit('/rooms/abc-def-123');
    cy.wait('@roomRequest');

    cy.get('[data-test=room-join-dialog]').should('not.exist');

    cy.get('[data-test=room-start-button]').click();

    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      // Test start with missing record attendance agreement
      cy.get('#record-agreement').click();
      cy.get('.p-button').eq(1).should('have.text', 'app.continue').click();

      cy.wait('@startRequest');

      cy.contains('Consent to record attendance is required.').should('be.visible')

      // Test start with missing record agreement
      cy.get('#record-agreement').click();
      cy.get('#record-attendance-agreement').click();

      cy.intercept('GET', '/api/v1/rooms/abc-def-123/start*', {
        statusCode: 473,
        body: {
          message: 'Consent to the recording is required.'
        }
      }).as('startRequest');

      cy.get('.p-button').eq(1).click();

      cy.wait('@startRequest');

      cy.contains('Consent to record attendance is required.').should('not.exist');
      cy.contains('Consent to the recording is required.').should('be.visible');

      cy.get('.p-button').eq(0).should('have.text', 'app.cancel').click();
    });

    cy.get('[data-test=room-join-dialog]').should('not.exist');
  });
});
