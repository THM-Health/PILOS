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

  it('join running meeting guests', function () { // ToDo intercept files request??
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

    cy.get('[data-test=room-join-button').click();
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.contains('rooms.first_and_lastname');
      cy.get('#guest-name').type('John Doe 123!');
      cy.get('#record-attendance-agreement').should('not.be.checked').click();
      cy.get('#record-agreement').should('not.be.checked').click();
      cy.get('#record-video-agreement').should('not.be.checked').click();
      cy.get('[data-test="dialog-continue-button"]').click();
    });

    cy.wait('@joinRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: 'John Doe 123!',
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true
      });
    });

    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
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

  it('join running meeting guests with access code', function () { // ToDo improve setting access code???
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
        current_user: null
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    cy.wait('@roomRequest');

    cy.get('#access-code').type('123456789');

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
        can_start: false,
        room_type_invalid: false,
        record_attendance: true,
        record: true,
        current_user: null
      }
    }).as('roomRequest');

    cy.get('[data-test="room-login-button"]').click();

    cy.wait('@roomRequest').then((interception) => {
      expect(interception.request.headers['access-code']).to.eq('123456789');
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

    cy.get('[data-test=room-join-button').click();
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.contains('rooms.first_and_lastname');
      cy.get('#guest-name').type('John Doe 123!');
      cy.get('#record-attendance-agreement').should('not.be.checked').click();
      cy.get('#record-agreement').should('not.be.checked').click();
      cy.get('#record-video-agreement').should('not.be.checked').click();
      cy.get('[data-test="dialog-continue-button"]').click();
    });

    cy.wait('@joinRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: 'John Doe 123!',
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true
      });
      expect(interception.request.headers['access-code']).to.eq('123456789');
    });

    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
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

    cy.wait('@joinRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: 'John Doe',
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true
      });
      expect(interception.request.headers['access-code']).to.eq('123456789');
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
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

    cy.visit('/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');

    cy.wait('@roomRequest').then((interception) => {
      expect(interception.request.headers.token).to.eq('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    });

    cy.get('[data-test=room-join-button').click();
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.get('#record-attendance-agreement').should('not.be.checked').click();
      cy.get('#record-agreement').should('not.be.checked').click();
      cy.get('#record-video-agreement').should('not.be.checked').click();
      cy.get('[data-test="dialog-continue-button"]').click();
    });

    cy.wait('@joinRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true
      });
      expect(interception.request.headers.token).to.eq('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
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
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
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
    cy.get('[data-test="try-again-button"]').click();

    cy.wait('@roomRequest');
    // test invalid access token (invalid_code)
    // ToDo improve test reset of access code (separate test??)
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
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
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
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
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
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

    cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
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
    }).as('joinRequest');

    cy.visit('/rooms/abc-def-123');
    cy.wait('@roomRequest');

    cy.get('[data-test=room-join-dialog]').should('not.exist');

    cy.get('[data-test=room-join-button]').click();

    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      // Test join with missing agreements
      cy.get('[data-test="dialog-continue-button"]').click();

      cy.wait('@joinRequest');

      cy.contains('The consent record attendance must be accepted.').should('be.visible');
      cy.contains('The consent record must be accepted.').should('be.visible');

      cy.get('[data-test="dialog-cancel-button"]').click();
    });

    cy.get('[data-test=room-join-dialog]').should('not.exist');

    // ToDo add test if one agreement is not shown before clicking on join
    // Form field and error message should be shown
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

    cy.intercept('POST', '/api/v1/rooms/abc-def-123/join*', {
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
    const startRequest = interceptIndefinitely('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 200,
      body: {
        url: 'https://example.org/?foo=a&bar=b'
      }
    }, 'startRequest');

    cy.visit('/rooms/abc-def-123');

    cy.get('[data-test=room-start-button]').should('not.be.disabled').and('have.text', 'rooms.start').click();
    cy.get('[data-test=room-start-button]').should('be.disabled').then(() => {
      startRequest.sendResponse();
    });

    cy.wait('@startRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: '',
        consent_record_attendance: false,
        consent_record: false,
        consent_record_video: false
      });
    });

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

    cy.get('[data-test=room-start-button').click();
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.contains('rooms.first_and_lastname');
      cy.get('#guest-name').type('John Doe 123!');
      cy.get('#record-attendance-agreement').should('not.be.checked').click();
      cy.get('#record-agreement').should('not.be.checked').click();
      cy.get('#record-video-agreement').should('not.be.checked').click();
      cy.get('[data-test="dialog-continue-button"]').click();
    });

    cy.wait('@startRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: 'John Doe 123!',
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true
      });
    });

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

  it('start meeting guests with access code', function () { // ToDo improve setting access code???
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
        current_user: null
      }
    }).as('roomRequest');

    cy.visit('/rooms/abc-def-123');

    cy.wait('@roomRequest');

    cy.get('#access-code').type('123456789');

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
        room_type_invalid: false,
        record_attendance: true,
        record: true,
        current_user: null
      }
    }).as('roomRequest');

    cy.get('[data-test="room-login-button"]').click();

    cy.wait('@roomRequest').then((interception) => {
      expect(interception.request.headers['access-code']).to.eq('123456789');
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

    cy.get('[data-test=room-start-button').click();
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.contains('rooms.first_and_lastname');
      cy.get('#guest-name').type('John Doe 123!');
      cy.get('#record-attendance-agreement').should('not.be.checked').click();
      cy.get('#record-agreement').should('not.be.checked').click();
      cy.get('#record-video-agreement').should('not.be.checked').click();
      cy.get('[data-test="dialog-continue-button"]').click();
    });

    cy.wait('@startRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: 'John Doe 123!',
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true
      });
      expect(interception.request.headers['access-code']).to.eq('123456789');
    });

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

    cy.wait('@startRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        name: 'John Doe',
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true
      });
      expect(interception.request.headers['access-code']).to.eq('123456789');
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
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

    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
      statusCode: 200,
      body: {
        url: 'https://example.org/?foo=a&bar=b'
      }
    }).as('startRequest');

    cy.visit('/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');

    cy.wait('@roomRequest').then((interception) => {
      expect(interception.request.headers.token).to.eq('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    });

    cy.get('[data-test=room-start-button').click();
    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      cy.get('#record-attendance-agreement').should('not.be.checked').click();
      cy.get('#record-agreement').should('not.be.checked').click();
      cy.get('#record-video-agreement').should('not.be.checked').click();
      cy.get('[data-test="dialog-continue-button"]').click();
    });

    cy.wait('@startRequest').then((interception) => {
      expect(interception.request.body).to.contain({
        consent_record_attendance: true,
        consent_record: true,
        consent_record_video: true
      });
      expect(interception.request.headers.token).to.eq('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    });

    // Check if redirect worked
    cy.origin('https://example.org', () => {
      cy.url().should('eq', 'https://example.org/?foo=a&bar=b');
    });
  });

  it('start meeting errors', function () {
    // test guests not allowed
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
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
    cy.get('[data-test="try-again-button"]').click();

    cy.wait('@roomRequest');
    // test invalid access token (invalid_code)
    // ToDo improve test reset of access code (separate test??)
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
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
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
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
    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
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

    cy.intercept('POST', '/api/v1/rooms/abc-def-123/start*', {
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
    }).as('startRequest');

    cy.visit('/rooms/abc-def-123');
    cy.wait('@roomRequest');

    cy.get('[data-test=room-join-dialog]').should('not.exist');

    cy.get('[data-test=room-start-button]').click();

    cy.get('[data-test=room-join-dialog]').should('be.visible').within(() => {
      // Test start with missing agreements
      cy.get('[data-test="dialog-continue-button"]').click();

      cy.wait('@startRequest');

      cy.contains('The consent record attendance must be accepted.').should('be.visible');
      cy.contains('The consent record must be accepted.').should('be.visible');

      cy.get('[data-test="dialog-cancel-button"]').click();
    });

    cy.get('[data-test=room-join-dialog]').should('not.exist');

    // ToDo add test if one agreement is not shown before clicking on start
    // Form field and error message should be shown
  });
});
