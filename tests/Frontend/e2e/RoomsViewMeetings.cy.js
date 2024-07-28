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

    const joinRequest = interceptIndefinitely('POST', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 200,
      body: {
        url: 'https://example.org/?foo=a&bar=b'
      }
    }, 'joinRequest');

    cy.visit('/rooms/abc-def-123');

    // Check that room join dialog is closed and click on join button
    cy.get('[data-test=room-join-dialog]').should('not.exist');
    cy.get('[data-test=room-join-button]').should('not.be.disabled').and('have.text', 'rooms.join').click();

    // Test loading
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.get('[data-test="dialog-cancel-button"]').should('be.disabled');
      cy.get('[data-test="dialog-continue-button"]').should('be.disabled');
    });
    cy.get('[data-test=room-join-button]').should('be.disabled').then(() => {
      joinRequest.sendResponse();
    });

    // Check that correct query is sent
    cy.wait('@joinRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: '',
        consent_record_attendance: false,
        consent_record: false,
        consent_record_video: false
      });
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
  });

  it('join running meeting attendance logging', function () {
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

    const joinRequest = interceptIndefinitely('POST', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 200,
      body: {
        url: 'https://example.org/?foo=a&bar=b'
      }
    }, 'joinRequest');

    cy.visit('/rooms/abc-def-123');

    cy.get('[data-test=room-join-dialog]').should('not.exist');
    cy.get('[data-test=room-join-button]').should('not.be.disabled').and('have.text', 'rooms.join').click();

    // Check if join dialog is shown correctly
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.contains('rooms.recording_attendance_info').should('be.visible');
      cy.contains('rooms.recording_attendance_accept').should('be.visible');
      cy.get('#record-attendance-agreement').should('not.be.checked').click();
      cy.get('[data-test="dialog-continue-button"]').click();

      // Check loading
      cy.get('[data-test="dialog-cancel-button"]').should('be.disabled');
      cy.get('[data-test="dialog-continue-button"]').should('be.disabled').then(() => {
        joinRequest.sendResponse();
      });
    });

    // Check that correct query is sent
    cy.wait('@joinRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: '',
        consent_record_attendance: true,
        consent_record: false,
        consent_record_video: false
      });
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
  });

  it('join running meeting with recording', function () {
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
    });

    const joinRequest = interceptIndefinitely('POST', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 200,
      body: {
        url: 'https://example.org/?foo=a&bar=b'
      }
    }, 'joinRequest');

    cy.visit('/rooms/abc-def-123');

    cy.get('[data-test=room-join-dialog]').should('not.exist');
    cy.get('[data-test=room-join-button]').should('not.be.disabled').and('have.text', 'rooms.join').click();

    // Check if join dialog is shown correctly
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.contains('rooms.recording_info').should('be.visible');
      cy.contains('rooms.recording_accept').should('be.visible');
      cy.contains('rooms.recording_video_accept').should('be.visible');

      cy.get('#record-agreement').should('not.be.checked').click();
      cy.get('#record-video-agreement').should('not.be.checked').click();
      cy.get('[data-test="dialog-continue-button"]').click();

      // Check loading
      cy.get('[data-test="dialog-cancel-button"]').should('be.disabled');
      cy.get('[data-test="dialog-continue-button"]').should('be.disabled').then(() => {
        joinRequest.sendResponse();
      });
    });

    // Check that correct query is sent
    cy.wait('@joinRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: '',
        consent_record_attendance: false,
        consent_record: true,
        consent_record_video: true
      });
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
  });

  it('join running meeting with recording without video', function () {
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
    });

    cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 200,
      body: {
        url: 'https://example.org/?foo=a&bar=b'
      }
    }).as('joinRequest');

    cy.visit('/rooms/abc-def-123');

    cy.get('[data-test=room-join-button]').click();

    // Check if join dialog is shown correctly
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.get('#record-agreement').should('not.be.checked').click();
      cy.get('[data-test="dialog-continue-button"]').click();
    });

    // Check that correct query is sent
    cy.wait('@joinRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: '',
        consent_record_attendance: false,
        consent_record: true,
        consent_record_video: false
      });
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
  });

  it('join running meeting guests', function () {
    cy.intercept('GET', 'api/v1/currentUser', {});
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
        access_code: null,
        room_type_invalid: false,
        record_attendance: true,
        record: true,
        current_user: null
      }
    });

    cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 422,
      body: {
        message: 'The given data was invalid',
        errors: {
          name: ['The name contains the following non-permitted characters: 123!']
        }
      }
    }).as('joinRequest');

    cy.visit('/rooms/abc-def-123');

    // Test with invalid name
    cy.get('[data-test=room-join-button').click();
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.contains('rooms.first_and_lastname');
      cy.get('#guest-name').type('John Doe 123!');
      cy.get('#record-attendance-agreement').should('not.be.checked').click();
      cy.get('#record-agreement').should('not.be.checked').click();
      cy.get('#record-video-agreement').should('not.be.checked').click();
      cy.get('[data-test="dialog-continue-button"]').click();
    });

    // Check that correct query is sent
    cy.wait('@joinRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: 'John Doe 123!',
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true
      });
    });

    // Test with valid name
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      // Check that error message for invalid name is shown and set valid name
      cy.contains('The name contains the following non-permitted characters: 123!').should('be.visible');
      cy.get('#guest-name').clear();
      cy.get('#guest-name').type('John Doe');

      cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
        statusCode: 200,
        body: {
          url: 'https://example.org/?foo=a&bar=b'
        }
      }).as('joinRequest');

      cy.get('[data-test="dialog-continue-button"]').click();
    });

    // Check that correct query is sent
    cy.wait('@joinRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: 'John Doe',
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true
      });
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
  });

  it('join running meeting with access code', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 2,
          name: 'Max Doe'
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
        authenticated: false,
        description: null,
        allow_membership: false,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        room_type_invalid: false,
        record_attendance: true,
        record: true,
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

    // Type in access code to get access to the room
    cy.wait('@roomRequest');
    cy.get('[data-test="room-access-code"] input').type('123456789'); // ToDo change back to #access-code

    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 2,
          name: 'Max Doe'
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
        can_start: false,
        room_type_invalid: false,
        record_attendance: true,
        record: true,
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

    cy.wait('@roomRequest');

    cy.get('[data-test=room-join-button').click();

    // Try to join the meeting
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.get('#record-attendance-agreement').should('not.be.checked').click();
      cy.get('#record-agreement').should('not.be.checked').click();
      cy.get('#record-video-agreement').should('not.be.checked').click();

      cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
        statusCode: 200,
        body: {
          url: 'https://example.org/?foo=a&bar=b'
        }
      }).as('joinRequest');

      cy.get('[data-test="dialog-continue-button"]').click();
    });

    // Check that correct query is sent
    cy.wait('@joinRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true
      });
      // Check that header for access code is set
      expect(interception.request.headers['access-code']).to.eq('123456789');
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
  });

  it('join running meeting access code errors', function () {
    cy.interceptRoomFilesRequest();

    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 2,
          name: 'Max Doe'
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
        authenticated: false,
        description: null,
        allow_membership: false,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        room_type_invalid: false,
        record_attendance: true,
        record: true,
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

    // Type in access code to get access to the room
    cy.wait('@roomRequest');
    cy.get('[data-test="room-access-code"] input').type('123456789'); // ToDo change back to #access-code

    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 2,
          name: 'Max Doe'
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
        can_start: false,
        room_type_invalid: false,
        record_attendance: true,
        record: true,
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

    cy.wait('@roomRequest');

    // Test invalid_code
    // Intercept join request with error response and room request for reload (not authenticated anymore)
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 401,
      body: {
        message: 'invalid_code'
      }
    }).as('joinRequest');

    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 2,
          name: 'Max Doe'
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
        authenticated: false,
        description: null,
        allow_membership: false,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        room_type_invalid: false,
        record_attendance: true,
        record: true,
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

    // Try to join meeting
    cy.get('[data-test=room-join-button').click();
    cy.get('[data-test="dialog-continue-button"]').click();

    // Check that header is set correctly
    cy.wait('@joinRequest').then(interception => {
      expect(interception.request.headers['access-code']).to.eq('123456789');
    });

    // Check that access code header is reset
    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.headers['access-code']).to.be.undefined;
    });

    // Check if error message is shown and close it
    cy.get('.p-toast').should('have.text', 'rooms.flash.access_code_invalid').find('button').click();
    cy.contains('rooms.flash.access_code_invalid').should('be.visible');

    // Intercept room request for reload (after entering access code)
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 2,
          name: 'Max Doe'
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
        can_start: false,
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
    cy.wait('@roomRequest');

    // Test require_code
    // Intercept join request with error response and room request for reload (not authenticated anymore)
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
      data: {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 2,
          name: 'Max Doe'
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
        authenticated: false,
        description: null,
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

    cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 403,
      body: {
        message: 'require_code'
      }
    }).as('joinRequest');

    // Try to join meeting
    cy.get('[data-test=room-join-button').click();

    // Check that header is set correctly
    cy.wait('@joinRequest').then(interception => {
      expect(interception.request.headers['access-code']).to.eq('123456789');
    });

    // Check that access code header is reset
    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.headers['access-code']).to.be.undefined;
    });

    // Check if error message is shown
    cy.get('.p-toast').should('have.text', 'rooms.flash.access_code_invalid').find('button').click();
    cy.contains('rooms.flash.access_code_invalid').should('be.visible');
  });

  it('join running meeting token', function () {
    cy.intercept('GET', 'api/v1/currentUser', {});
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
        access_code: null,
        room_type_invalid: false,
        record_attendance: true,
        record: true,
        current_user: null
      }
    }).as('roomRequest');

    cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 200,
      body: {
        url: 'https://example.org/?foo=a&bar=b'
      }
    }).as('joinRequest');

    // Visit room with token
    cy.visit('/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');

    // Try to join meeting
    cy.get('[data-test=room-join-button').click();
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.get('#record-attendance-agreement').should('not.be.checked').click();
      cy.get('#record-agreement').should('not.be.checked').click();
      cy.get('#record-video-agreement').should('not.be.checked').click();
      cy.get('[data-test="dialog-continue-button"]').click();
    });

    // Check that correct query is sent
    cy.wait('@joinRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true
      });
      // Check that header for token is set
      expect(interception.request.headers.token).to.eq('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
  });

  it('join running meeting token errors', function () {
    cy.intercept('GET', 'api/v1/currentUser', {});
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/files*', {
      statusCode: 200,
      body: {
        data: [],
        meta: {
          from: null
        }
      }
    });
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
        access_code: null,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: null
      }
    }).as('roomRequest');

    cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 401,
      body: {
        message: 'invalid_token'
      }
    }).as('joinRequest');

    // Visit room with token
    cy.visit('/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');

    // Try to join meeting
    cy.get('[data-test=room-join-button]').click();

    cy.wait('@joinRequest');

    // Check if error message is shown
    cy.get('.p-toast').should('be.visible').and('have.text', 'rooms.flash.token_invalid').find('button').click();
    cy.contains('rooms.invalid_personal_link').should('be.visible');
  });

  it('join meeting errors', function () {
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
        current_user: null
      }
    }).as('roomRequest');

    // Test guests not allowed
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 403,
      body: {
        message: 'guests_not_allowed'
      }
    }).as('joinRequest');

    cy.visit('/rooms/abc-def-123');
    cy.wait('@roomRequest');

    // Try to join meeting
    cy.get('[data-test=room-join-button]').should('have.text', 'rooms.join').click();

    cy.wait('@joinRequest');

    // Check if error message is shown
    cy.contains('rooms.only_used_by_authenticated_users').should('be.visible');

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

    // Reload room
    cy.get('[data-test="reload-room-button"]').click();

    cy.wait('@roomRequest');

    // Join meeting errors room settings changed and because of that the agreements are missing
    const joinRequest = interceptIndefinitely('POST', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 422,
      body: {
        message: 'The consent record attendance must be accepted. (and 1 more error)',
        errors: {
          consent_record_attendance: [
            'The consent record attendance must be accepted.'
          ],
          consent_record: [
            'The consent record must be accepted.'
          ]
        }
      }
    }, 'joinRequest');

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

    cy.get('[data-test=room-join-dialog]').should('not.exist');
    cy.get('[data-test=room-join-button]').click();
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      // Make sure that checkboxes for agreements are not shown
      cy.contains('rooms.recording_info').should('not.exist');
      cy.contains('rooms.recording_accept').should('not.exist');
      cy.contains('rooms.recording_video_accept').should('not.exist');

      cy.get('#record-agreement').should('not.exist');
      cy.get('#record-video-agreement').should('not.exist');
      cy.get('[data-test="dialog-continue-button"]').should('be.disabled').then(() => {
        joinRequest.sendResponse();
      });

      cy.wait('@joinRequest');
      cy.wait('@roomRequest');

      // Check that checkboxes for agreements are shown
      cy.contains('rooms.recording_info').should('be.visible');
      cy.contains('rooms.recording_accept').should('be.visible');
      cy.contains('rooms.recording_video_accept').should('be.visible');

      // Check if error messages are shown
      cy.contains('The consent record attendance must be accepted.').should('be.visible');
      cy.contains('The consent record must be accepted.').should('be.visible');

      // Close dialog
      cy.get('[data-test="dialog-cancel-button"]').click();
    });

    // Join meeting errors missing agreements
    cy.get('[data-test=room-join-dialog]').should('not.exist');
    cy.get('[data-test=room-join-button]').click();
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      // Check if error messages are reset
      cy.contains('The consent record attendance must be accepted.').should('not.exist');
      cy.contains('The consent record must be accepted.').should('not.exist');

      // Try to join meeting
      cy.get('[data-test="dialog-continue-button"]').click();

      cy.wait('@joinRequest');
      cy.wait('@roomRequest');

      // Check if error messages are shown
      cy.contains('The consent record attendance must be accepted.').should('be.visible');
      cy.contains('The consent record must be accepted.').should('be.visible');

      // Close dialog
      cy.get('[data-test="dialog-cancel-button"]').click();
    });

    // Test general errors
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('joinRequest');

    // Try to join meeting
    cy.get('[data-test=room-join-button]').should('have.text', 'rooms.join').click();
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait('@joinRequest');

    // Check if error message is shown and close it
    cy.get('.p-toast')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}')
      .find('button').click();

    // Test meeting error room closed
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
      statusCode: 460,
      body: {
        message: 'Joining failed! The room is currently closed.'
      }
    }).as('joinRequest');

    // Intercept reload request
    cy.intercept('GET', 'api/v1/rooms/abc-def-123', { fixture: 'exampleRoom.json' }).as('roomRequest');

    // Try to join meeting
    cy.get('[data-test=room-join-button]').click();
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait('@joinRequest');
    cy.wait('@roomRequest');

    // Check if error message is shown and button has switched to start room
    cy.get('.p-toast').should('be.visible').and('have.text', 'app.errors.not_running');

    cy.get('[data-test=room-join-button]').should('not.exist');
    cy.get('[data-test=room-start-button]').should('have.text', 'rooms.start');
  });

  it('start meeting', function () {
    const startRequest = interceptIndefinitely('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 200,
      body: {
        url: 'https://example.org/?foo=a&bar=b'
      }
    }, 'startRequest');

    cy.visit('/rooms/abc-def-123');

    // Check that room join dialog is closed and click on start button
    cy.get('[data-test=room-join-dialog]').should('not.exist');
    cy.get('[data-test=room-start-button]').should('not.be.disabled').and('have.text', 'rooms.start').click();

    // Test loading
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.get('[data-test="dialog-cancel-button"]').should('be.disabled');
      cy.get('[data-test="dialog-continue-button"]').should('be.disabled');
    });
    cy.get('[data-test=room-start-button]').should('be.disabled').then(() => {
      startRequest.sendResponse();
    });

    // Check that correct query is sent
    cy.wait('@startRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: '',
        consent_record_attendance: false,
        consent_record: false,
        consent_record_video: false
      });
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
  });

  it('start meeting attendance logging', function () {
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

    const joinRequest = interceptIndefinitely('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 200,
      body: {
        url: 'https://example.org/?foo=a&bar=b'
      }
    }, 'startRequest');

    cy.visit('/rooms/abc-def-123');

    cy.get('[data-test=room-join-dialog]').should('not.exist');
    cy.get('[data-test=room-start-button]').should('not.be.disabled').and('have.text', 'rooms.start').click();

    // Check if join dialog is shown correctly
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.contains('rooms.recording_attendance_info').should('be.visible');
      cy.contains('rooms.recording_attendance_accept').should('be.visible');
      cy.get('#record-attendance-agreement').should('not.be.checked').click();
      cy.get('[data-test="dialog-continue-button"]').click();

      // Check loading
      cy.get('[data-test="dialog-cancel-button"]').should('be.disabled');
      cy.get('[data-test="dialog-continue-button"]').should('be.disabled').then(() => {
        joinRequest.sendResponse();
      });
    });

    // Check that correct query is sent
    cy.wait('@startRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: '',
        consent_record_attendance: true,
        consent_record: false,
        consent_record_video: false
      });
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
  });

  it('start meeting with recording', function () {
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
        record_attendance: false,
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
    });

    const joinRequest = interceptIndefinitely('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 200,
      body: {
        url: 'https://example.org/?foo=a&bar=b'
      }
    }, 'startRequest');

    cy.visit('/rooms/abc-def-123');

    cy.get('[data-test=room-join-dialog]').should('not.exist');
    cy.get('[data-test=room-start-button]').should('not.be.disabled').and('have.text', 'rooms.start').click();

    // Check if join dialog is shown correctly
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.contains('rooms.recording_info').should('be.visible');
      cy.contains('rooms.recording_accept').should('be.visible');
      cy.contains('rooms.recording_video_accept').should('be.visible');

      cy.get('#record-agreement').should('not.be.checked').click();
      cy.get('#record-video-agreement').should('not.be.checked').click();
      cy.get('[data-test="dialog-continue-button"]').click();

      // Check loading
      cy.get('[data-test="dialog-cancel-button"]').should('be.disabled');
      cy.get('[data-test="dialog-continue-button"]').should('be.disabled').then(() => {
        joinRequest.sendResponse();
      });
    });

    // Check that correct query is sent
    cy.wait('@startRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: '',
        consent_record_attendance: false,
        consent_record: true,
        consent_record_video: true
      });
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
  });

  it('start meeting with recording without video', function () {
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
        record_attendance: false,
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
    });

    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 200,
      body: {
        url: 'https://example.org/?foo=a&bar=b'
      }
    }).as('startRequest');

    cy.visit('/rooms/abc-def-123');

    cy.get('[data-test=room-start-button]').click();

    // Check if join dialog is shown correctly
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.get('#record-agreement').should('not.be.checked').click();
      cy.get('[data-test="dialog-continue-button"]').click();
    });

    // Check that correct query is sent
    cy.wait('@startRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: '',
        consent_record_attendance: false,
        consent_record: true,
        consent_record_video: false
      });
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
  });

  it('start meeting guests', function () {
    cy.intercept('GET', 'api/v1/currentUser', {});
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
        access_code: null,
        room_type_invalid: false,
        record_attendance: true,
        record: true,
        current_user: null
      }
    });

    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 422,
      body: {
        message: 'The given data was invalid',
        errors: {
          name: ['The name contains the following non-permitted characters: 123!']
        }
      }
    }).as('startRequest');

    cy.visit('/rooms/abc-def-123');

    // Test with invalid name
    cy.get('[data-test=room-start-button').click();
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.contains('rooms.first_and_lastname');
      cy.get('#guest-name').type('John Doe 123!');
      cy.get('#record-attendance-agreement').should('not.be.checked').click();
      cy.get('#record-agreement').should('not.be.checked').click();
      cy.get('#record-video-agreement').should('not.be.checked').click();
      cy.get('[data-test="dialog-continue-button"]').click();
    });

    // Check that correct query is sent
    cy.wait('@startRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: 'John Doe 123!',
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true
      });
    });

    // Test with valid name
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.contains('The name contains the following non-permitted characters: 123!').should('be.visible');
      cy.get('#guest-name').clear();
      cy.get('#guest-name').type('John Doe');

      cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
        statusCode: 200,
        body: {
          url: 'https://example.org/?foo=a&bar=b'
        }
      }).as('startRequest');

      cy.get('[data-test="dialog-continue-button"]').click();
    });

    // Check that correct query is sent
    cy.wait('@startRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: 'John Doe',
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true
      });
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
  });

  it('start meeting with access code', function () {
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
        description: null,
        allow_membership: false,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        room_type_invalid: false,
        record_attendance: true,
        record: true,
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

    // Type in access code to get access to the room
    cy.wait('@roomRequest');
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
        description: null,
        allow_membership: false,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        room_type_invalid: false,
        record_attendance: true,
        record: true,
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

    cy.wait('@roomRequest');

    // Test with invalid name
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 422,
      body: {
        message: 'The given data was invalid',
        errors: {
          name: ['The name contains the following non-permitted characters: 123!']
        }
      }
    }).as('startRequest');

    cy.get('[data-test=room-start-button').click();

    // Try to start the meeting
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.get('#record-attendance-agreement').should('not.be.checked').click();
      cy.get('#record-agreement').should('not.be.checked').click();
      cy.get('#record-video-agreement').should('not.be.checked').click();

      cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
        statusCode: 200,
        body: {
          url: 'https://example.org/?foo=a&bar=b'
        }
      }).as('startRequest');

      cy.get('[data-test="dialog-continue-button"]').click();
    });

    // Check that correct query is sent
    cy.wait('@startRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true
      });
      // Check that header for access code is set
      expect(interception.request.headers['access-code']).to.eq('123456789');
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
  });

  it('start meeting access code errors', function () {
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
        authenticated: false,
        description: null,
        allow_membership: false,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        room_type_invalid: false,
        record_attendance: true,
        record: true,
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

    // Type in access code to get access to the room
    cy.wait('@roomRequest');
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
        description: null,
        allow_membership: false,
        is_member: false,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        room_type_invalid: false,
        record_attendance: true,
        record: true,
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

    cy.wait('@roomRequest');

    // Test invalid_code
    // Intercept start request with error response and room request for reload (not authenticated anymore)
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 401,
      body: {
        message: 'invalid_code'
      }
    }).as('startRequest');

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
        description: null,
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

    // Try to start meeting
    cy.get('[data-test=room-start-button]').click();
    cy.get('[data-test="dialog-continue-button"]').click();

    // Check that header is set correctly
    cy.wait('@startRequest').then(interception => {
      expect(interception.request.headers['access-code']).to.eq('123456789');
    });

    // Check that access code header is reset
    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.headers['access-code']).to.be.undefined;
    });

    // Check if error message is shown and close it
    cy.get('.p-toast').should('be.visible').and('have.text', 'rooms.flash.access_code_invalid').find('button').click();
    cy.contains('rooms.flash.access_code_invalid').should('be.visible');

    // Intercept room request for reload (after entering access code)
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

    cy.get('[data-test="room-login-button"]').click();
    cy.wait('@roomRequest');

    // Test require_code
    // Intercept start request with error response and room request for reload (not authenticated anymore)
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 403,
      body: {
        message: 'require_code'
      }
    }).as('startRequest');

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
        description: null,
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

    // Try to start meeting
    cy.get('[data-test=room-start-button]').click();

    // Check that header is set correctly
    cy.wait('@startRequest').then(interception => {
      expect(interception.request.headers['access-code']).to.eq('123456789');
    });

    // Check that access code header is reset
    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.headers['access-code']).to.be.undefined;
    });

    // Check if error message is shown
    cy.get('.p-toast').should('be.visible').and('have.text', 'rooms.flash.access_code_invalid').find('button').click();
    cy.contains('rooms.flash.access_code_invalid').should('be.visible');
  });

  it('start meeting token', function () {
    cy.intercept('GET', 'api/v1/currentUser', {});
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
        is_member: true,
        is_moderator: false,
        is_co_owner: false,
        can_start: true,
        access_code: null,
        room_type_invalid: false,
        record_attendance: true,
        record: true,
        current_user: null
      }
    }).as('roomRequest');

    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 200,
      body: {
        url: 'https://example.org/?foo=a&bar=b'
      }
    }).as('startRequest');

    // Visit room with token
    cy.visit('/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');

    // Try to start meeting
    cy.get('[data-test=room-start-button').click();
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.get('#record-attendance-agreement').should('not.be.checked').click();
      cy.get('#record-agreement').should('not.be.checked').click();
      cy.get('#record-video-agreement').should('not.be.checked').click();
      cy.get('[data-test="dialog-continue-button"]').click();
    });

    // Check that correct query is sent
    cy.wait('@startRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true
      });
      // Check that header for token is set
      expect(interception.request.headers.token).to.eq('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
  });

  it('start meeting token errors', function () {
    cy.intercept('GET', 'api/v1/currentUser', {});
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/files*', {
      statusCode: 200,
      body: {
        data: [],
        meta: {
          from: null
        }
      }
    });
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
        access_code: null,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: null
      }
    }).as('roomRequest');

    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 401,
      body: {
        message: 'invalid_token'
      }
    }).as('startRequest');

    // Visit room with token
    cy.visit('/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');

    // Try to start meeting
    cy.get('[data-test=room-start-button]').click();

    cy.wait('@startRequest');

    // Check if error message is shown
    cy.get('.p-toast').should('be.visible').and('have.text', 'rooms.flash.token_invalid').find('button').click();
    cy.contains('rooms.invalid_personal_link').should('be.visible');
  });

  it('start meeting errors', function () {
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
        access_code: null,
        room_type_invalid: false,
        record_attendance: false,
        record: false,
        current_user: null
      }
    }).as('roomRequest');

    // Test guests not allowed
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 403,
      body: {
        message: 'guests_not_allowed'
      }
    }).as('startRequest');

    cy.visit('/rooms/abc-def-123');
    cy.wait('@roomRequest');

    // Try to start meeting
    cy.get('[data-test=room-start-button]').should('have.text', 'rooms.start').click();

    cy.wait('@startRequest');

    // Check if error message is shown
    cy.contains('rooms.only_used_by_authenticated_users').should('be.visible');

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

    // Reload room
    cy.get('[data-test="reload-room-button"]').click();

    cy.wait('@roomRequest');

    // Start meeting errors room settings changed and because of that the agreements are missing
    const startRequest = interceptIndefinitely('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 422,
      body: {
        message: 'The consent record attendance must be accepted. (and 1 more error)',
        errors: {
          consent_record_attendance: [
            'The consent record attendance must be accepted.'
          ],
          consent_record: [
            'The consent record must be accepted.'
          ]
        }
      }
    }, 'startRequest');

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

    cy.get('[data-test=room-join-dialog]').should('not.exist');
    cy.get('[data-test=room-start-button]').click();

    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      // Make sure that checkboxes for agreements are not shown
      cy.contains('rooms.recording_info').should('not.exist');
      cy.contains('rooms.recording_accept').should('not.exist');
      cy.contains('rooms.recording_video_accept').should('not.exist');

      cy.get('#record-agreement').should('not.exist');
      cy.get('#record-video-agreement').should('not.exist');
      cy.get('[data-test="dialog-continue-button"]').should('be.disabled').then(() => {
        startRequest.sendResponse();
      });

      cy.wait('@startRequest');
      cy.wait('@roomRequest');

      // Check that checkboxes for agreements are shown
      cy.contains('rooms.recording_info').should('be.visible');
      cy.contains('rooms.recording_accept').should('be.visible');
      cy.contains('rooms.recording_video_accept').should('be.visible');

      cy.get('#record-agreement').should('not.be.checked');
      cy.get('#record-video-agreement').should('not.be.checked');
      cy.get('[data-test="dialog-continue-button"]').should('not.be.disabled');

      // Check if error messages are shown
      cy.contains('The consent record attendance must be accepted.').should('be.visible');
      cy.contains('The consent record must be accepted.').should('be.visible');

      // Close dialog
      cy.get('[data-test="dialog-cancel-button"]').click();
    });

    cy.get('[data-test=room-join-dialog]').should('not.exist');

    // Start meeting errors missing agreements

    cy.get('[data-test=room-join-dialog]').should('not.exist');
    cy.get('[data-test=room-start-button]').click();

    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      // Check if error messages are reset
      cy.contains('The consent record attendance must be accepted.').should('not.exist');
      cy.contains('The consent record must be accepted.').should('not.exist');

      // Try to start meeting
      cy.get('[data-test="dialog-continue-button"]').click();

      cy.wait('@startRequest');
      cy.wait('@roomRequest');

      // Check if error messages are shown
      cy.contains('The consent record attendance must be accepted.').should('be.visible');
      cy.contains('The consent record must be accepted.').should('be.visible');

      // Close dialog
      cy.get('[data-test="dialog-cancel-button"]').click();
    });

    // Test general errors
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('startRequest');

    // Try to start meeting
    cy.get('[data-test=room-start-button]').click();
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait('@startRequest');

    // Check that room join dialog is closed
    cy.get('[data-test=room-join-dialog]').should('not.exist');
    // Check if error message is shown and close it
    cy.get('.p-toast')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}')
      .find('button').click();

    // Test start forbidden
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 403,
      body: {
        message: 'This action is unauthorized.'
      }
    }).as('startRequest');

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
        can_start: false,
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

    // Try to start meeting
    cy.get('[data-test=room-start-button]').click();
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait('@startRequest');
    cy.wait('@roomRequest');

    // Check that room join dialog is closed
    cy.get('[data-test=room-join-dialog]').should('not.exist');
    // Check if error message is shown and close it
    cy.get('.p-toast')
      .should('be.visible')
      .and('include.text', 'rooms.flash.start_forbidden')
      .find('button').eq(0).click();

    // Check that start room button does not exist anymore
    cy.get('[data-test=room-start-button]').should('not.exist');
    cy.contains('rooms.not_running').should('be.visible');

    // Reload room with permission to start room
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

    cy.get('[data-test=reload-room-button]').click();

    cy.wait('@roomRequest');

    // Test room already running
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 474,
      body: {
        message: 'The room could not be started because it is already running.'
      }
    }).as('startRequest');

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

    cy.get('[data-test=room-start-button]').click();
    cy.contains('rooms.not_running').should('not.exist');
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait('@startRequest');
    cy.wait('@roomRequest');

    cy.get('[data-test=room-join-button]').should('have.text', 'rooms.join');
    cy.get('[data-test=room-start-button]').should('not.exist');

    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.contains('app.errors.room_already_running');

      // Check if join request gets send when clicking on continue button
      cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
        statusCode: 200,
        body: {
          url: 'https://example.org/?foo=a&bar=b'
        }
      }).as('joinRequest');

      cy.get('[data-test="dialog-continue-button"]').click();
    });
    cy.wait('@joinRequest');

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
  });
});
