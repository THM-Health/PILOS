import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';

describe('Rooms View Files', function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomFilesRequest();
  });

  it('load files', function () {
    const roomFileRequest = interceptIndefinitely('GET', 'api/v1/rooms/abc-def-123/files*', { fixture: 'roomFiles.json' }, 'roomFilesRequest');

    cy.visit('/rooms/abc-def-123');

    cy.get('#tab-files').click();

    cy.url().should('include', '/rooms/abc-def-123#files');

    // Check loading
    cy.get('[data-test="overlay"]').should('be.visible');

    cy.get('[data-test="room-files-search"]').within(() => {
      cy.get('input').should('be.disabled');
      cy.get('button').should('be.disabled');
    });

    cy.get('[data-test="filter-dropdown"').within(() => {
      cy.get('.p-select-label').should('have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test="sorting-type-inputgroup"').within(() => {
      cy.get('[data-test="sorting-type-dropdown"').within(() => {
        cy.get('.p-select-label').should('have.attr', 'aria-disabled', 'true');
      });

      cy.get('button').should('be.disabled');
    });

    cy.get('[data-test="room-files-upload-button"]').should('be.disabled');

    cy.get('[data-test="room-files-reload-button"]').should('be.disabled').then(() => {
      roomFileRequest.sendResponse();
    });

    cy.wait('@roomFilesRequest');

    cy.get('[data-test="overlay"]').should('not.exist');

    // Check that loading is done
    cy.get('[data-test="room-files-search"]').within(() => {
      cy.get('input').should('not.be.disabled');
      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="filter-dropdown"').within(() => {
      cy.get('.p-select-label').should('have.attr', 'aria-disabled', 'false');
    });

    cy.get('[data-test="sorting-type-inputgroup"').within(() => {
      cy.get('[data-test="sorting-type-dropdown"').within(() => {
        cy.get('.p-select-label').should('have.attr', 'aria-disabled', 'false');
      });

      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="room-files-upload-button"]').should('not.be.disabled');
    cy.get('[data-test="room-files-reload-button"]').should('not.be.disabled');

    // Check files
    cy.get('[data-test="room-file-item"]').should('have.length', 3);

    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'File1.pdf');
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'Sep 21, 2020, 09:08');
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'rooms.files.download_visible');
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'rooms.files.use_in_next_meeting_disabled');

    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'File2.pdf');
    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'Sep 21, 2020, 09:08');
    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'rooms.files.download_visible');
    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'rooms.files.use_in_next_meeting');

    cy.get('[data-test="room-file-item"]').eq(2).should('include.text', 'File3.pdf');
    cy.get('[data-test="room-file-item"]').eq(2).should('include.text', 'Sep 21, 2020, 09:09');
    cy.get('[data-test="room-file-item"]').eq(2).should('include.text', 'rooms.files.download_hidden');
    cy.get('[data-test="room-file-item"]').eq(2).should('include.text', 'rooms.files.use_in_next_meeting_disabled');
  });

  it('load files with access code', function () {
    cy.fixture('room.json').then((room) => {
      room.data.owner = { id: 2, name: 'Max Doe' };
      room.data.authenticated = false;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    cy.intercept('GET', 'api/v1/rooms/abc-def-123/files*', { fixture: 'roomFilesNoDetails.json' }).as('roomFilesRequest');

    cy.visit('/rooms/abc-def-123');

    // Type in access code to get access to the room
    cy.wait('@roomRequest');
    cy.get('#access-code').type('123456789');

    cy.fixture('room.json').then((room) => {
      room.data.owner = { id: 2, name: 'Max Doe' };

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait('@roomRequest');

    cy.wait('@roomFilesRequest').then((interception) => {
      // Check that header for access code is set
      expect(interception.request.headers['access-code']).to.eq('123456789');
    });

    cy.contains('rooms.files.title').should('be.visible');

    // Check that download agreement is shown
    cy.get('[data-test="download-agreement-message"]').should('be.visible');
    cy.get('[data-test="download-agreement-message"]').should('include.text', 'rooms.files.terms_of_use.title');
    cy.get('[data-test="download-agreement-message"]').should('include.text', 'rooms.files.terms_of_use.content');
    cy.get('[data-test="download-agreement-message"]').should('include.text', 'rooms.files.terms_of_use.accept');
    cy.get('[data-test="download-agreement-message"]').find('#terms_of_use').should('not.be.checked');

    // Check that files are shown correctly
    cy.get('[data-test="room-file-item"]').should('have.length', 2);
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'File1.pdf');
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'Sep 21, 2020, 09:08');
    cy.get('[data-test="room-file-item"]').eq(0).should('not.include.text', 'rooms.files.download_visible');
    cy.get('[data-test="room-file-item"]').eq(0).should('not.include.text', 'rooms.files.use_in_next_meeting_disabled');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-view-button"]').should('be.disabled');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-edit-button"]').should('not.exist');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-delete-button"]').should('not.exist');

    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'File2.pdf');
    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'Sep 21, 2020, 09:08');
    cy.get('[data-test="room-file-item"]').eq(1).should('not.include.text', 'rooms.files.download_visible');
    cy.get('[data-test="room-file-item"]').eq(1).should('not.include.text', 'rooms.files.use_in_next_meeting');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-view-button"]').should('be.disabled');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-edit-button"]').should('not.exist');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-delete-button"]').should('not.exist');

    // Accept download agreement
    cy.get('#terms_of_use').click();
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-view-button"]').should('not.be.disabled');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-view-button"]').should('not.be.disabled');
  });

  it('load files with access code errors', function () { // ToDo file requests after room request (problem???)
    cy.fixture('room.json').then((room) => {
      room.data.owner = { id: 2, name: 'Max Doe' };
      room.data.authenticated = false;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    cy.intercept('GET', 'api/v1/rooms/abc-def-123/files*', {
      statusCode: 401,
      body: {
        message: 'invalid_code'
      }
    }).as('roomFilesRequest');

    cy.visit('/rooms/abc-def-123');

    // Type in access code to get access to the room
    cy.wait('@roomRequest');
    cy.get('#access-code').type('123456789');

    cy.fixture('room.json').then((room1) => {
      room1.data.owner = { id: 2, name: 'Max Doe' };

      const firstRoomRequest = interceptIndefinitely('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room1
      }, 'roomRequest');

      cy.get('[data-test="room-login-button"]').click();

      cy.fixture('room.json').then((room2) => {
        room2.data.owner = { id: 2, name: 'Max Doe' };
        room2.data.authenticated = false;

        cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
          statusCode: 200,
          body: room2
        }).as('roomRequest').then(() => {
          firstRoomRequest.sendResponse();
        });
      });
    });

    cy.wait('@roomRequest');

    cy.wait('@roomFilesRequest').then((interception) => {
      // Check that header for access code is set
      expect(interception.request.headers['access-code']).to.eq('123456789');
    });

    // Check that access code header is reset
    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.headers['access-code']).to.be.undefined;
    });

    cy.wait('@roomFilesRequest').then((interception) => {
      // Check that header for access code is set
      expect(interception.request.headers['access-code']).to.be.undefined;
    });

    // Check if error message is shown and close it
    cy.checkToastMessage('rooms.flash.access_code_invalid');

    cy.contains('rooms.flash.access_code_invalid').should('be.visible');

    // Test require_code
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/files*', {
      statusCode: 403,
      body: {
        message: 'require_code'
      }
    }).as('roomFilesRequest');

    cy.fixture('room.json').then((room1) => {
      room1.data.owner = { id: 2, name: 'Max Doe' };

      const firstRoomRequest = interceptIndefinitely('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room1
      }, 'roomRequest');

      cy.get('[data-test="room-login-button"]').click();

      cy.fixture('room.json').then((room2) => {
        room2.data.owner = { id: 2, name: 'Max Doe' };
        room2.data.authenticated = false;

        cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
          statusCode: 200,
          body: room2
        }).as('roomRequest').then(() => {
          firstRoomRequest.sendResponse();
        });
      });
    });

    cy.wait('@roomRequest');

    cy.wait('@roomFilesRequest').then((interception) => {
      // Check that header for access code is set
      expect(interception.request.headers['access-code']).to.eq('123456789');
    });

    // Check that access code header is reset
    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.headers['access-code']).to.be.undefined;
    });

    cy.wait('@roomFilesRequest').then((interception) => {
      // Check that header for access code is set
      expect(interception.request.headers['access-code']).to.be.undefined;
    });

    // Check if error message is shown
    cy.checkToastMessage('rooms.flash.access_code_invalid');

    cy.contains('rooms.flash.access_code_invalid').should('be.visible');
  });

  it('load files with token', function () {
    cy.intercept('GET', 'api/v1/currentUser', {});
    cy.fixture('room.json').then((room) => {
      room.data.username = 'Max Doe';
      room.data.current_user = null;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    cy.intercept('GET', 'api/v1/rooms/abc-def-123/files*', { fixture: 'roomFilesNoDetails.json' }).as('roomFilesRequest');

    // Visit room with token
    cy.visit('/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');

    cy.wait('@roomRequest');

    cy.wait('@roomFilesRequest').then((interception) => {
      // Check that header for token is set
      expect(interception.request.headers.token).to.eq('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    });

    cy.contains('rooms.files.title').should('be.visible');

    // Check that files are shown correctly
    // Check that download agreement is shown
    cy.get('[data-test="download-agreement-message"]').should('be.visible');
    cy.get('[data-test="download-agreement-message"]').should('include.text', 'rooms.files.terms_of_use.title');
    cy.get('[data-test="download-agreement-message"]').should('include.text', 'rooms.files.terms_of_use.content');
    cy.get('[data-test="download-agreement-message"]').should('include.text', 'rooms.files.terms_of_use.accept');
    cy.get('[data-test="download-agreement-message"]').find('#terms_of_use').should('not.be.checked');

    // Check that files are shown correctly
    cy.get('[data-test="room-file-item"]').should('have.length', 2);
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'File1.pdf');
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'Sep 21, 2020, 09:08');
    cy.get('[data-test="room-file-item"]').eq(0).should('not.include.text', 'rooms.files.download_visible');
    cy.get('[data-test="room-file-item"]').eq(0).should('not.include.text', 'rooms.files.use_in_next_meeting_disabled');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-view-button"]').should('be.disabled');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-edit-button"]').should('not.exist');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-delete-button"]').should('not.exist');

    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'File2.pdf');
    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'Sep 21, 2020, 09:08');
    cy.get('[data-test="room-file-item"]').eq(1).should('not.include.text', 'rooms.files.download_visible');
    cy.get('[data-test="room-file-item"]').eq(1).should('not.include.text', 'rooms.files.use_in_next_meeting');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-view-button"]').should('be.disabled');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-edit-button"]').should('not.exist');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-delete-button"]').should('not.exist');

    // Accept download agreement
    cy.get('#terms_of_use').click();
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-view-button"]').should('not.be.disabled');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-view-button"]').should('not.be.disabled');
  });

  it('load files with token errors', function () {
    cy.intercept('GET', 'api/v1/currentUser', {});
    cy.fixture('room.json').then((room) => {
      room.data.username = 'Max Doe';
      room.data.current_user = null;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    cy.intercept('GET', 'api/v1/rooms/abc-def-123/files*', {
      statusCode: 401,
      body: {
        message: 'invalid_token'
      }
    }).as('roomFilesRequest');

    // Visit room with token
    cy.visit('/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');

    cy.wait('@roomRequest');

    cy.wait('@roomFilesRequest');

    // Check if error message is shown
    cy.checkToastMessage('rooms.flash.token_invalid');

    cy.contains('rooms.invalid_personal_link').should('be.visible');
  });

  it('load files errors', function () {
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/files*', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('roomFilesRequest');

    cy.visit('/rooms/abc-def-123/#files');
    cy.wait('@roomFilesRequest');

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should('be.visible');

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}'
    ]);

    // Check that components are not disabled
    cy.get('[data-test="room-files-search"]').within(() => {
      cy.get('input').should('not.be.disabled');
      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="filter-dropdown"').within(() => {
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test="sorting-type-inputgroup"').within(() => {
      cy.get('[data-test="sorting-type-dropdown"').within(() => {
        cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
      });

      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="room-files-reload-button"]').should('not.be.disabled');

    cy.fixture('roomFiles.json').then((roomFiles) => {
      roomFiles.data = roomFiles.data.slice(0, 1);
      roomFiles.meta.last_page = 3;
      roomFiles.meta.per_page = 1;
      roomFiles.meta.to = 1;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/files*', {
        statusCode: 200,
        body: roomFiles
      }).as('roomFilesRequest');
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]').should('include.text', 'app.reload').click();
    cy.wait('@roomFilesRequest');

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should('not.exist');
    cy.get('[data-test="loading-retry-button"]').should('not.exist');

    // Check if file is shown and contains the correct data
    cy.get('[data-test="room-file-item"]').should('have.length', 1);
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'File1.pdf');

    // Switch to next page with general error
    cy.intercept('GET', 'api/v1/rooms/abc-def-123/files*', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('roomFilesRequest');

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait('@roomFilesRequest');

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}'
    ]);

    // Check that components are not disabled
    cy.get('[data-test="room-files-search"]').within(() => {
      cy.get('input').should('not.be.disabled');
      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="filter-dropdown"').within(() => {
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test="sorting-type-inputgroup"').within(() => {
      cy.get('[data-test="sorting-type-dropdown"').within(() => {
        cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
      });

      cy.get('button').should('not.be.disabled');
    });

    cy.get('[data-test="room-files-reload-button"]').should('not.be.disabled');

    cy.fixture('roomFiles.json').then((roomFiles) => {
      roomFiles.data = roomFiles.data.slice(0, 1);
      roomFiles.meta.last_page = 3;
      roomFiles.meta.per_page = 1;
      roomFiles.meta.to = 1;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123/files*', {
        statusCode: 200,
        body: roomFiles
      }).as('roomFilesRequest');
    });

    // Check if reload button exists and click it
    cy.get('[data-test="overlay"]').should('be.visible');
    cy.get('[data-test="loading-retry-button"]').should('include.text', 'app.reload').click();

    cy.wait('@roomFilesRequest').then(interception => {
      expect(interception.request.query).to.contain({
        page: '1'
      });
    });

    // Check if file is shown and contains the correct data
    cy.get('[data-test="room-file-item"]').should('have.length', 1);
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'File1.pdf');

    // Check that reload button does not exist
    cy.get('[data-test="overlay"]').should('not.exist');
    cy.get('[data-test="loading-retry-button"]').should('not.exist');

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]').eq(0).should('have.attr', 'data-p-active', 'true');
  });

  it('view with different permissions', function () {
    // Check view for guest
    cy.intercept('GET', 'api/v1/currentUser', {});
    cy.fixture('room.json').then((room) => {
      room.data.current_user = null;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    cy.intercept('GET', 'api/v1/rooms/abc-def-123/files*', { fixture: 'roomFilesNoDetails.json' }).as('roomFilesRequest');

    cy.visit('/rooms/abc-def-123');
    cy.wait('@roomRequest');
    cy.wait('@roomFilesRequest');

    // Check that download agreement is shown
    cy.get('[data-test="download-agreement-message"]').should('be.visible');
    cy.get('[data-test="download-agreement-message"]').should('include.text', 'rooms.files.terms_of_use.title');
    cy.get('[data-test="download-agreement-message"]').should('include.text', 'rooms.files.terms_of_use.content');
    cy.get('[data-test="download-agreement-message"]').should('include.text', 'rooms.files.terms_of_use.accept');
    cy.get('[data-test="download-agreement-message"]').find('#terms_of_use').should('not.be.checked');

    // Check that files are shown correctly and buttons are disabled or hidden
    cy.get('[data-test="room-file-item"]').should('have.length', 2);
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'File1.pdf');
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'Sep 21, 2020, 09:08');
    cy.get('[data-test="room-file-item"]').eq(0).should('not.include.text', 'rooms.files.download_visible');
    cy.get('[data-test="room-file-item"]').eq(0).should('not.include.text', 'rooms.files.use_in_next_meeting_disabled');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-view-button"]').should('be.disabled');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-edit-button"]').should('not.exist');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-delete-button"]').should('not.exist');

    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'File2.pdf');
    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'Sep 21, 2020, 09:08');
    cy.get('[data-test="room-file-item"]').eq(1).should('not.include.text', 'rooms.files.download_visible');
    cy.get('[data-test="room-file-item"]').eq(1).should('not.include.text', 'rooms.files.use_in_next_meeting');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-view-button"]').should('be.disabled');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-edit-button"]').should('not.exist');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-delete-button"]').should('not.exist');

    // Accept download agreement
    cy.get('#terms_of_use').click();
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-view-button"]').should('not.be.disabled');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-view-button"]').should('not.be.disabled');

    // Check view with rooms.viewAll permission
    cy.fixture('currentUser.json').then(currentUser => {
      currentUser.data.permissions = ['rooms.viewAll'];
      cy.intercept('GET', 'api/v1/currentUser', {
        statusCode: 200,
        body: currentUser
      });
    });

    cy.fixture('room.json').then((room) => {
      room.data.owner = { id: 2, name: 'Max Doe' };
      room.data.current_user.permissions = ['rooms.viewAll'];

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    cy.reload();
    cy.wait('@roomRequest');
    cy.get('#tab-files').click();
    cy.wait('@roomFilesRequest');

    // Check that files are shown correctly
    // Check that download agreement is shown
    cy.get('[data-test="download-agreement-message"]').should('be.visible');
    cy.get('[data-test="download-agreement-message"]').should('include.text', 'rooms.files.terms_of_use.title');
    cy.get('[data-test="download-agreement-message"]').should('include.text', 'rooms.files.terms_of_use.content');
    cy.get('[data-test="download-agreement-message"]').should('include.text', 'rooms.files.terms_of_use.accept');
    cy.get('[data-test="download-agreement-message"]').find('#terms_of_use').should('not.be.checked');

    // Check that files are shown correctly and buttons are disabled or hidden
    cy.get('[data-test="room-file-item"]').should('have.length', 2);
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'File1.pdf');
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'Sep 21, 2020, 09:08');
    cy.get('[data-test="room-file-item"]').eq(0).should('not.include.text', 'rooms.files.download_visible');
    cy.get('[data-test="room-file-item"]').eq(0).should('not.include.text', 'rooms.files.use_in_next_meeting_disabled');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-view-button"]').should('be.disabled');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-edit-button"]').should('not.exist');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-delete-button"]').should('not.exist');

    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'File2.pdf');
    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'Sep 21, 2020, 09:08');
    cy.get('[data-test="room-file-item"]').eq(1).should('not.include.text', 'rooms.files.download_visible');
    cy.get('[data-test="room-file-item"]').eq(1).should('not.include.text', 'rooms.files.use_in_next_meeting');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-view-button"]').should('be.disabled');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-edit-button"]').should('not.exist');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-delete-button"]').should('not.exist');

    // Accept download agreement
    cy.get('#terms_of_use').click();
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-view-button"]').should('not.be.disabled');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-view-button"]').should('not.be.disabled');

    // Check for co_owner
    cy.intercept('GET', 'api/v1/currentUser', { fixture: 'currentUser.json' });

    cy.fixture('room.json').then((room) => {
      room.data.owner = { id: 2, name: 'Max Doe' };
      room.data.is_member = true;
      room.data.is_co_owner = true;

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    cy.intercept('GET', 'api/v1/rooms/abc-def-123/files*', { fixture: 'roomFiles.json' }).as('roomFilesRequest');

    cy.reload();
    cy.wait('@roomRequest');
    cy.wait('@roomFilesRequest');

    // Check that download agreement is hidden
    cy.get('[data-test="download-agreement-message"]').should('not.exist');

    // Check that files are shown correctly and buttons are enabled
    cy.get('[data-test="room-file-item"]').should('have.length', 3);
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'File1.pdf');
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'Sep 21, 2020, 09:08');
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'rooms.files.download_visible');
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'rooms.files.use_in_next_meeting_disabled');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-view-button"]').should('not.be.disabled');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-edit-button"]').should('not.be.disabled');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-delete-button"]').should('not.be.disabled');

    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'File2.pdf');
    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'Sep 21, 2020, 09:08');
    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'rooms.files.download_visible');
    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'rooms.files.use_in_next_meeting');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-view-button"]').should('not.be.disabled');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-edit-button"]').should('not.be.disabled');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-delete-button"]').should('not.be.disabled');

    cy.get('[data-test="room-file-item"]').eq(2).should('include.text', 'File3.pdf');
    cy.get('[data-test="room-file-item"]').eq(2).should('include.text', 'Sep 21, 2020, 09:09');
    cy.get('[data-test="room-file-item"]').eq(2).should('include.text', 'rooms.files.download_hidden');
    cy.get('[data-test="room-file-item"]').eq(2).should('include.text', 'rooms.files.use_in_next_meeting_disabled');
    cy.get('[data-test="room-file-item"]').eq(2).find('[data-test="room-files-view-button"]').should('not.be.disabled');
    cy.get('[data-test="room-file-item"]').eq(2).find('[data-test="room-files-edit-button"]').should('not.be.disabled');
    cy.get('[data-test="room-file-item"]').eq(2).find('[data-test="room-files-delete-button"]').should('not.be.disabled');

    // Check view with rooms.manage permission
    cy.fixture('currentUser.json').then(currentUser => {
      currentUser.data.permissions = ['rooms.viewAll', 'rooms.manage'];
      cy.intercept('GET', 'api/v1/currentUser', {
        statusCode: 200,
        body: currentUser
      });
    });

    cy.fixture('room.json').then((room) => {
      room.data.owner = { id: 2, name: 'Max Doe' };
      room.data.current_user.permissions = ['rooms.viewAll', 'rooms.manage'];

      cy.intercept('GET', 'api/v1/rooms/abc-def-123', {
        statusCode: 200,
        body: room
      }).as('roomRequest');
    });

    cy.reload();
    cy.wait('@roomRequest');
    cy.wait('@roomFilesRequest');

    // Check that download agreement is hidden
    cy.get('[data-test="download-agreement-message"]').should('not.exist');

    // Check that files are shown correctly and buttons are enabled
    cy.get('[data-test="room-file-item"]').should('have.length', 3);
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'File1.pdf');
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'Sep 21, 2020, 09:08');
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'rooms.files.download_visible');
    cy.get('[data-test="room-file-item"]').eq(0).should('include.text', 'rooms.files.use_in_next_meeting_disabled');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-view-button"]').should('not.be.disabled');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-edit-button"]').should('not.be.disabled');
    cy.get('[data-test="room-file-item"]').eq(0).find('[data-test="room-files-delete-button"]').should('not.be.disabled');

    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'File2.pdf');
    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'Sep 21, 2020, 09:08');
    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'rooms.files.download_visible');
    cy.get('[data-test="room-file-item"]').eq(1).should('include.text', 'rooms.files.use_in_next_meeting');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-view-button"]').should('not.be.disabled');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-edit-button"]').should('not.be.disabled');
    cy.get('[data-test="room-file-item"]').eq(1).find('[data-test="room-files-delete-button"]').should('not.be.disabled');

    cy.get('[data-test="room-file-item"]').eq(2).should('include.text', 'File3.pdf');
    cy.get('[data-test="room-file-item"]').eq(2).should('include.text', 'Sep 21, 2020, 09:09');
    cy.get('[data-test="room-file-item"]').eq(2).should('include.text', 'rooms.files.download_hidden');
    cy.get('[data-test="room-file-item"]').eq(2).should('include.text', 'rooms.files.use_in_next_meeting_disabled');
    cy.get('[data-test="room-file-item"]').eq(2).find('[data-test="room-files-view-button"]').should('not.be.disabled');
    cy.get('[data-test="room-file-item"]').eq(2).find('[data-test="room-files-edit-button"]').should('not.be.disabled');
    cy.get('[data-test="room-file-item"]').eq(2).find('[data-test="room-files-delete-button"]').should('not.be.disabled');
  });
});
