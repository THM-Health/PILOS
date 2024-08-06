import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';

describe('Room Index', function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomIndexRequests();
  });

  it('visit with user that is not logged in', function () {
    cy.testVisitWithoutCurrentUser('/rooms');
  });

  it('check list of rooms and opening room view', function () {
    const roomRequestInterception = interceptIndefinitely('GET', 'api/v1/rooms?*', { fixture: 'exampleRooms.json' }, 'roomRequest');
    cy.interceptRoomViewRequests();

    cy.visit('/rooms');

    // Test loading
    // Room search field
    cy.get('[data-test=room-search]').eq(0).within(() => {
      cy.get('.p-inputtext').should('be.disabled');
      cy.get('.p-button').should('be.disabled');
    });

    // Only favorites button
    cy.get('[data-test=only-favorites-button]').should('be.disabled');

    // Room type dropdown
    cy.get('[data-test=room-type-dropdown]').within(() => {
      cy.get('.p-select-label').should('have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test=filter-button]').should('not.be.visible');

    // Sorting dropdown
    cy.get('[data-test=sorting-type-dropdown]').within(() => {
      cy.get('.p-select-label')
        .should('have.attr', 'aria-disabled', 'true')
        .then(() => {
          roomRequestInterception.sendResponse();
        });
    });

    // Make sure that components are not disabled after response
    // Room search field
    cy.get('[data-test=room-search]').eq(0).within(() => {
      cy.get('.p-inputtext').should('not.be.disabled');
      cy.get('.p-button').should('not.be.disabled');
    });

    // Only favorites button
    cy.get('[data-test=only-favorites-button]').should('not.be.disabled');

    // Room type dropdown
    cy.get('[data-test=room-type-dropdown]').within(() => {
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    cy.get('[data-test=filter-button]').should('not.be.visible');

    // Check that room info dialog is closed
    cy.get('[data-test="room-info-dialog"]').should('not.exist');

    // Check if rooms are shown and contain the correct data
    cy.get('[data-test="room-card"]').should('have.length', 3);

    cy.get('[data-test="room-card"]').eq(2).should('include.text', 'Meeting Three');
    cy.get('[data-test="room-card"]').eq(2).should('include.text', 'John Doe');
    cy.get('[data-test="room-card"]').eq(2).should('include.text', 'rooms.index.room_component.last_ran_till_{"date":"08/21/2023, 08:20"}');
    cy.get('[data-test="room-card"]').eq(2).within(() => {
      cy.get('a').should('have.attr', 'href', '/rooms/def-abc-456');
      cy.get('[data-test="room-info-button"]').should('not.exist');
      cy.get('[data-test="room-favorites-button"]').should('be.visible').and('have.attr', 'aria-label', 'rooms.favorites.add');
    });

    cy.get('[data-test="room-card"]').eq(1).should('include.text', 'Meeting Two');
    cy.get('[data-test="room-card"]').eq(1).should('include.text', 'John Doe');
    cy.get('[data-test="room-card"]').eq(1).should('include.text', 'rooms.index.room_component.running_since_{"date":"08/21/2023, 08:18"}');
    cy.get('[data-test="room-card"]').eq(1).within(() => {
      cy.get('a').should('have.attr', 'href', '/rooms/def-abc-123');
      cy.get('[data-test="room-info-button"]').should('not.exist');
      cy.get('[data-test="room-favorites-button"]').should('be.visible').and('have.attr', 'aria-label', 'rooms.favorites.remove');
    });

    cy.get('[data-test="room-card"]').eq(0).should('include.text', 'Meeting One');
    cy.get('[data-test="room-card"]').eq(0).should('include.text', 'John Doe');
    cy.get('[data-test="room-card"]').eq(0).should('include.text', 'rooms.index.room_component.never_started');
    cy.get('[data-test="room-card"]').eq(0).within(() => {
      cy.get('a').should('have.attr', 'href', '/rooms/abc-def-123');
      cy.get('[data-test="room-favorites-button"]').should('be.visible').and('have.attr', 'aria-label', 'rooms.favorites.add');

      // Open room info dialog for this room
      cy.get('[data-test="room-info-button"]').click();
    });

    // Check that room info dialog is open and contains the correct data
    cy.get('[data-test="room-info-dialog"]').should('be.visible').within(() => {
      cy.contains('Meeting One').should('be.visible');
      cy.contains('John Doe').should('be.visible');
      cy.contains('Room short description').should('be.visible');
      cy.contains('rooms.index.room_component.never_started').should('be.visible');

      // Open room view
      cy.get('[data-test="dialog-continue-button"]').click();
    });

    cy.url().should('include', '/rooms/abc-def-123');
  });

  it('click on room card to open room view', function () {
    cy.interceptRoomViewRequests();

    cy.visit('/rooms');

    // Click on room card to open room view
    cy.get('[data-test="room-card"]').eq(0).click();

    cy.url().should('include', '/rooms/abc-def-123');
  });

  it('sorting', function () {
    cy.visit('/rooms');

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        sort_by: 'last_started',
        page: '1'
      });
    });

    cy.get('[data-test=sorting-type-dropdown-items]').should('not.exist');

    // Check that correct sorting type is displayed
    cy.get('[data-test=sorting-type-dropdown]').should('include.text', 'rooms.index.sorting.last_started').click();

    cy.get('[data-test=sorting-type-dropdown-items]').should('be.visible').within(() => {
      // Check that sorting options are shown correctly
      cy.get('[data-test=sorting-type-dropdown-option]').should('have.length', 3);
      cy.get('[data-test=sorting-type-dropdown-option]').eq(0).should('include.text', 'rooms.index.sorting.last_started');
      cy.get('[data-test=sorting-type-dropdown-option]').eq(1).should('include.text', 'rooms.index.sorting.alpha');
      cy.get('[data-test=sorting-type-dropdown-option]').eq(2).should('include.text', 'rooms.index.sorting.room_type');

      // Change sorting type and respond with 3 rooms on 3 different pages
      cy.intercept('GET', 'api/v1/rooms?*', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 'abc-def-123',
              name: 'Meeting One',
              owner: {
                id: 1,
                name: 'John Doe'
              },
              last_meeting: null,
              type: {
                id: 1,
                name: 'Meeting',
                color: '#4a5c66'
              },
              is_favorite: false,
              short_description: 'Room short description'
            }
          ],
          meta: {
            current_page: 1,
            from: 1,
            last_page: 3,
            per_page: 1,
            to: 1,
            total: 3,
            total_no_filter: 3,
            total_own: 1
          }
        }
      }).as('roomRequest');

      cy.get('[data-test=sorting-type-dropdown-option]').eq(1).click();
    });

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        sort_by: 'alpha',
        page: '1'
      });
    });

    cy.get('[data-test=sorting-type-dropdown-items]').should('not.exist');

    cy.get('[data-test=sorting-type-dropdown]').should('include.text', 'rooms.index.sorting.alpha');

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]').should('have.length', 1).and('include.text', 'Meeting One');

    // Check that pagination shows the correct number of pages and switch to next page
    cy.get('[data-test="paginator-page"]').should('have.length', 3);

    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'def-abc-123',
            name: 'Meeting Two',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: {
              start: '2023-08-21 08:18:28:00',
              end: null
            },
            type: {
              id: 1,
              name: 'Meeting',
              color: '#4a5c66'
            },
            is_favorite: true,
            short_description: null
          }
        ],
        meta: {
          current_page: 2,
          from: 2,
          last_page: 3,
          per_page: 1,
          to: 2,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if sorting stays the same after changing page
    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        sort_by: 'alpha',
        page: '2'
      });
    });

    cy.get('[data-test=sorting-type-dropdown]').should('include.text', 'rooms.index.sorting.alpha');

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]').should('have.length', 1).and('include.text', 'Meeting Two');

    // Change sorting again and make sure that page is reset
    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 1,
              name: 'Meeting',
              color: '#4a5c66'
            },
            is_favorite: false,
            short_description: 'Room short description'
          }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 3,
          per_page: 1,
          to: 1,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test=sorting-type-dropdown]').click();
    cy.get('[data-test=sorting-type-dropdown-option]').eq(2).click();

    // Check that rooms are loaded with the page reset to the first page
    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        sort_by: 'room_type',
        page: '1'
      });
    });
  });

  it('search', function () {
    cy.visit('/rooms');

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query.search).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: '1'
      });
    });

    // Check with no rooms found for this search query
    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 1,
          to: null,
          total: 0,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="room-search"] > input').type('Test');
    cy.get('[data-test="room-search"] > button').click();

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        search: 'Test',
        page: '1'
      });
    });

    // Check if correct message is shown
    cy.contains('rooms.no_rooms_found').should('be.visible');

    // Check with no rooms available
    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 1,
          to: null,
          total: 0,
          total_no_filter: 0,
          total_own: 0
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="room-search"] > input').clear();
    cy.get('[data-test="room-search"] > input').type('Test2');
    cy.get('[data-test="room-search"] > input').type('{enter}');

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        search: 'Test2',
        page: '1'
      });
    });

    // Check if correct message is shown
    cy.contains('rooms.no_rooms_available').should('be.visible');

    // Check with 2 rooms on 2 pages
    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 1,
              name: 'Meeting',
              color: '#4a5c66'
            },
            is_favorite: false,
            short_description: 'Room short description'
          }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 2,
          per_page: 1,
          to: 1,
          total: 2,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="room-search"] > input').clear();
    cy.get('[data-test="room-search"] > input').type('Meeting');
    cy.get('[data-test="room-search"] > button').click();

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        search: 'Meeting',
        page: '1'
      });
    });

    // Check that correct room is shown
    cy.get('[data-test="room-card"]').should('have.length', 1).and('include.text', 'Meeting One');

    // Check that pagination shows the correct number of pages and switch to next page
    cy.get('[data-test="paginator-page"]').should('have.length', 2);

    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'def-abc-123',
            name: 'Meeting Two',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: {
              start: '2023-08-21 08:18:28:00',
              end: null
            },
            type: {
              id: 1,
              name: 'Meeting',
              color: '#4a5c66'
            },
            is_favorite: true,
            short_description: null
          }
        ],
        meta: {
          current_page: 2,
          from: 2,
          last_page: 2,
          per_page: 1,
          to: 2,
          total: 2,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if the search query stays the same after changing page
    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        search: 'Meeting',
        page: '2'
      });
    });

    cy.get('[data-test="room-search"] > input').should('have.value', 'Meeting');

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]').should('have.length', 1).and('include.text', 'Meeting Two');

    // Change search query and make sure that page is reset
    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 1,
              name: 'Meeting',
              color: '#4a5c66'
            },
            is_favorite: false,
            short_description: 'Room short description'
          }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 2,
          per_page: 1,
          to: 1,
          total: 2,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="room-search"] > input').clear();
    cy.get('[data-test="room-search"] > input').type('Meet');
    cy.get('[data-test="room-search"] > button').click();

    // Check that rooms are loaded with the page reset to the first page
    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        search: 'Meet',
        page: '1'
      });
    });
  });

  it('filter room type', function () {
    cy.visit('/rooms');

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query.room_type).to.be.undefined;
      expect(interception.request.query).to.contain({
        page: '1'
      });
    });

    cy.get('[data-test="room-type-dropdown-items"]').should('not.exist');

    // Check that correct room type is displayed
    cy.get('[data-test="room-type-dropdown"]').should('include.text', 'rooms.room_types.all').click();

    cy.get('[data-test="room-type-dropdown-items"]').should('be.visible').within(() => {
      // Check that room types are shown correctly
      cy.get('[data-test="room-type-dropdown-option"]').should('have.length', 4);

      cy.get('[data-test="room-type-dropdown-option"]').eq(0).should('include.text', 'Lecture');
      cy.get('[data-test="room-type-dropdown-option"]').eq(1).should('include.text', 'Meeting');
      cy.get('[data-test="room-type-dropdown-option"]').eq(2).should('include.text', 'Exam');
      cy.get('[data-test="room-type-dropdown-option"]').eq(3).should('include.text', 'Seminar');
    });

    // Change room type and respond with no rooms found for this room type

    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 1,
          to: null,
          total: 0,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="room-type-dropdown-option"]').eq(1).click();

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        room_type: '2',
        page: '1'
      });
    });

    cy.get('[data-test="room-type-dropdown-items"]').should('not.exist');
    cy.contains('rooms.no_rooms_found').should('be.visible');

    // Check that room type is shown correctly and change it again to check for no rooms available
    cy.get('[data-test="room-type-dropdown"]').should('include.text', 'Meeting').click();

    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 1,
          to: null,
          total: 0,
          total_no_filter: 0,
          total_own: 0
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="room-type-dropdown-option"]').eq(2).click();

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        room_type: '3',
        page: '1'
      });
    });

    cy.get('[data-test="room-type-dropdown-items"]').should('not.exist');
    cy.contains('rooms.no_rooms_available').should('be.visible');

    // Check that room type is shown correctly and change it again to check with 3 rooms on 3 pages

    cy.get('[data-test="room-type-dropdown"]').should('include.text', 'Exam').click();

    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 1,
              name: 'Meeting',
              color: '#4a5c66'
            },
            is_favorite: false,
            short_description: 'Room short description'
          }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 3,
          per_page: 1,
          to: 1,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="room-type-dropdown-option"]').eq(3).click();

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        room_type: '4',
        page: '1'
      });
    });

    cy.get('[data-test="room-type-dropdown-items"]').should('not.exist');

    cy.get('[data-test="room-type-dropdown"]').should('include.text', 'Seminar');

    // Check that correct room is shown
    cy.get('[data-test="room-card"]').should('have.length', 1).and('include.text', 'Meeting One');

    // Check that pagination shows the correct number of pages and switch to next page
    cy.get('[data-test="paginator-page"]').should('have.length', 3);

    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'def-abc-123',
            name: 'Meeting Two',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: {
              start: '2023-08-21 08:18:28:00',
              end: null
            },
            type: {
              id: 1,
              name: 'Meeting',
              color: '#4a5c66'
            },
            is_favorite: true,
            short_description: null
          }
        ],
        meta: {
          current_page: 2,
          from: 2,
          last_page: 3,
          per_page: 1,
          to: 2,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    // Check if room type stays the same after changing page
    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        room_type: '4',
        page: '2'
      });
    });

    cy.get('[data-test="room-type-dropdown"]').should('include.text', 'Seminar');

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]').should('have.length', 1).and('include.text', 'Meeting Two');

    // Change room type again and make sure that page is reset

    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 1,
              name: 'Meeting',
              color: '#4a5c66'
            },
            is_favorite: false,
            short_description: 'Room short description'
          }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 3,
          per_page: 1,
          to: 1,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="room-type-dropdown"]').click();
    cy.get('[data-test="room-type-dropdown-option"]').eq(0).click();

    // Check that rooms are loaded with the page reset to the first page
    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        room_type: '1',
        page: '1'
      });
    });
  });

  it('filter without viewAll permission', function () {
    cy.visit('/rooms');

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        filter_own: '1',
        filter_shared: '1',
        filter_public: '0',
        filter_all: '0',
        page: '1'
      });
    });

    // Check that filter buttons are shown correctly
    cy.get('[data-test="rooms-filter-all-button"]').should('not.exist');
    cy.get('[data-test="rooms-filter-button"]').should('have.length', 3);
    cy.get('[data-test="rooms-filter-button"]').eq(0).should('include.text', 'rooms.index.show_own').and('have.attr', 'aria-pressed', 'true');
    cy.get('[data-test="rooms-filter-button"]').eq(1).should('include.text', 'rooms.index.show_shared').and('have.attr', 'aria-pressed', 'true');
    cy.get('[data-test="rooms-filter-button"]').eq(2).should('include.text', 'rooms.index.show_public').and('have.attr', 'aria-pressed', 'false');

    // Trigger filter button and respond with no rooms available for this filter combination
    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 1,
          to: null,
          total: 0,
          total_no_filter: 0,
          total_own: 0
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="rooms-filter-button"]').eq(1).click();

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        filter_own: '1',
        filter_shared: '0',
        filter_public: '0',
        filter_all: '0',
        page: '1'
      });
    });

    // Check correct message is shown
    cy.contains('rooms.no_rooms_available').should('be.visible');

    // Check that button was updated
    cy.get('[data-test="rooms-filter-button"]').eq(1).should('have.attr', 'aria-pressed', 'false');

    // Trigger filter button and respond with 3 rooms on 3 different pages
    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 1,
              name: 'Meeting',
              color: '#4a5c66'
            },
            is_favorite: false,
            short_description: 'Room short description'
          }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 3,
          per_page: 1,
          to: 1,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="rooms-filter-button"]').eq(2).click();

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        filter_own: '1',
        filter_shared: '0',
        filter_public: '1',
        filter_all: '0',
        page: '1'
      });
    });

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]').should('have.length', 1).and('include.text', 'Meeting One');

    // Check that button was updated
    cy.get('[data-test="rooms-filter-button"]').eq(2).should('have.attr', 'aria-pressed', 'true');

    // Check that pagination shows the correct number of pages and switch to next page
    cy.get('[data-test="paginator-page"]').should('have.length', 3);

    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'def-abc-123',
            name: 'Meeting Two',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: {
              start: '2023-08-21 08:18:28:00',
              end: null
            },
            type: {
              id: 1,
              name: 'Meeting',
              color: '#4a5c66'
            },
            is_favorite: true,
            short_description: null
          }
        ],
        meta: {
          current_page: 2,
          from: 2,
          last_page: 3,
          per_page: 1,
          to: 2,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        filter_own: '1',
        filter_shared: '0',
        filter_public: '1',
        filter_all: '0',
        page: '2'
      });
    });

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]').should('have.length', 1).and('include.text', 'Meeting Two');

    // Check that button did not change
    cy.get('[data-test="rooms-filter-button"]').eq(2).should('have.attr', 'aria-pressed', 'true');

    // Trigger another filter button and make sure that the page is reset
    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 1,
              name: 'Meeting',
              color: '#4a5c66'
            },
            is_favorite: false,
            short_description: 'Room short description'
          }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 3,
          per_page: 1,
          to: 1,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="rooms-filter-button"]').eq(0).click();

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        filter_own: '0',
        filter_shared: '0',
        filter_public: '1',
        filter_all: '0',
        page: '1'
      });
    });

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]').should('have.length', 1).and('include.text', 'Meeting One');

    // Check that button was updated
    cy.get('[data-test="rooms-filter-button"]').eq(0).should('have.attr', 'aria-pressed', 'false');
  });

  it('filter with viewAll permission', function () {
    cy.intercept('GET', 'api/v1/currentUser', {
      data: {
        id: 1,
        firstname: 'John',
        lastname: 'Doe',
        locale: 'en',
        permissions: ['rooms.viewAll'],
        model_name: 'User',
        room_limit: -1
      }
    });

    cy.visit('/rooms');

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        filter_own: '1',
        filter_shared: '1',
        filter_public: '0',
        filter_all: '0',
        page: '1'
      });
    });

    // Check that filter buttons are shown correctly
    cy.get('[data-test="rooms-filter-all-button"]').should('include.text', 'rooms.index.show_all').and('have.attr', 'aria-pressed', 'false');
    cy.get('[data-test="rooms-filter-button"]').should('have.length', 3);
    cy.get('[data-test="rooms-filter-button"]').eq(0).should('include.text', 'rooms.index.show_own').and('have.attr', 'aria-pressed', 'true');
    cy.get('[data-test="rooms-filter-button"]').eq(1).should('include.text', 'rooms.index.show_shared').and('have.attr', 'aria-pressed', 'true');
    cy.get('[data-test="rooms-filter-button"]').eq(2).should('include.text', 'rooms.index.show_public').and('have.attr', 'aria-pressed', 'false');

    // Trigger filter all button and respond with no rooms available for this filter combination
    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 1,
          to: null,
          total: 0,
          total_no_filter: 0,
          total_own: 0
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="rooms-filter-all-button"]').click();

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        filter_own: '1',
        filter_shared: '1',
        filter_public: '0',
        filter_all: '1',
        page: '1'
      });
    });

    // Check that correct message is shown
    cy.contains('rooms.no_rooms_available').should('be.visible');

    // Check that other filter buttons are disabled and filter all button is updated
    cy.get('[data-test="rooms-filter-all-button"]').should('include.text', 'rooms.index.show_all').and('have.attr', 'aria-pressed', 'true');
    cy.get('[data-test="rooms-filter-button"]').should('have.length', 0);

    // Trigger filter all button again and check that other filter buttons did not change
    cy.intercept('GET', 'api/v1/rooms*', { fixture: 'exampleRooms.json' }).as('roomRequest');

    cy.get('[data-test="rooms-filter-all-button"]').click();

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        filter_own: '1',
        filter_shared: '1',
        filter_public: '0',
        filter_all: '0',
        page: '1'
      });
    });

    cy.get('[data-test="rooms-filter-all-button"]').should('include.text', 'rooms.index.show_all').and('have.attr', 'aria-pressed', 'false');
    cy.get('[data-test="rooms-filter-button"]').should('have.length', 3);
    cy.get('[data-test="rooms-filter-button"]').eq(0).should('include.text', 'rooms.index.show_own').and('have.attr', 'aria-pressed', 'true');
    cy.get('[data-test="rooms-filter-button"]').eq(1).should('include.text', 'rooms.index.show_shared').and('have.attr', 'aria-pressed', 'true');
    cy.get('[data-test="rooms-filter-button"]').eq(2).should('include.text', 'rooms.index.show_public').and('have.attr', 'aria-pressed', 'false');

    // Trigger filter button (don't change response)
    cy.get('[data-test="rooms-filter-button"]').eq(2).click();
    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        filter_own: '1',
        filter_shared: '1',
        filter_public: '1',
        filter_all: '0',
        page: '1'
      });
    });

    // Trigger filter all button and respond with 3 rooms on 3 different pages
    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 1,
              name: 'Meeting',
              color: '#4a5c66'
            },
            is_favorite: false,
            short_description: 'Room short description'
          }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 3,
          per_page: 1,
          to: 1,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="rooms-filter-all-button"]').click();

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        filter_own: '1',
        filter_shared: '1',
        filter_public: '1',
        filter_all: '1',
        page: '1'
      });
    });

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]').should('have.length', 1).and('include.text', 'Meeting One');

    // Check that button was updated and other filter buttons are hidden
    cy.get('[data-test="rooms-filter-all-button"]').should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-test="rooms-filter-button"]').should('have.length', 0);

    // Check that pagination shows the correct number of pages and switch to next page
    cy.get('[data-test="paginator-page"]').should('have.length', 3);

    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'def-abc-123',
            name: 'Meeting Two',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: {
              start: '2023-08-21 08:18:28:00',
              end: null
            },
            type: {
              id: 1,
              name: 'Meeting',
              color: '#4a5c66'
            },
            is_favorite: true,
            short_description: null
          }
        ],
        meta: {
          current_page: 2,
          from: 2,
          last_page: 3,
          per_page: 1,
          to: 2,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        filter_own: '1',
        filter_shared: '1',
        filter_public: '1',
        filter_all: '1',
        page: '2'
      });
    });

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]').should('have.length', 1).and('include.text', 'Meeting Two');

    // Check that button was updated and other filter buttons are still hidden
    cy.get('[data-test="rooms-filter-all-button"]').should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-test="rooms-filter-button"]').should('have.length', 0);

    // Trigger filter button again and make sure that the page is reset
    cy.intercept('GET', 'api/v1/rooms?*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 1,
              name: 'Meeting',
              color: '#4a5c66'
            },
            is_favorite: false,
            short_description: 'Room short description'
          }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 3,
          per_page: 1,
          to: 1,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    }).as('roomRequest');

    cy.get('[data-test="rooms-filter-all-button"]').click();

    cy.wait('@roomRequest').then(interception => {
      expect(interception.request.query).to.contain({
        filter_own: '1',
        filter_shared: '1',
        filter_public: '1',
        filter_all: '0',
        page: '1'
      });
    });

    // Check that room is shown correctly
    cy.get('[data-test="room-card"]').should('have.length', 1).and('include.text', 'Meeting One');

    // Check that button was updated
    cy.get('[data-test="rooms-filter-all-button"]').should('have.attr', 'aria-pressed', 'false');

    // Check that the other filter buttons are shown again and still have the same state
    cy.get('[data-test="rooms-filter-button"]').should('have.length', 3);
    cy.get('[data-test="rooms-filter-button"]').eq(0).should('include.text', 'rooms.index.show_own').and('have.attr', 'aria-pressed', 'true');
    cy.get('[data-test="rooms-filter-button"]').eq(1).should('include.text', 'rooms.index.show_shared').and('have.attr', 'aria-pressed', 'true');
    cy.get('[data-test="rooms-filter-button"]').eq(2).should('include.text', 'rooms.index.show_public').and('have.attr', 'aria-pressed', 'true');
  });

  it('error loading rooms', function () {
    cy.intercept('GET', 'api/v1/rooms*', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    }).as('roomRequest');

    cy.visit('/rooms');
    cy.wait('@roomRequest');

    // Check that error message gets shown
    cy.get('.p-toast-message')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}');

    // Check that components are not disabled
    // Room search field
    cy.get('[data-test=room-search]').eq(0).within(() => {
      cy.get('.p-inputtext').should('not.be.disabled');
      cy.get('.p-button').should('not.be.disabled');
    });

    // Only favorites button
    cy.get('[data-test=only-favorites-button]').should('not.be.disabled');

    // Room type dropdown
    cy.get('[data-test=room-type-dropdown]').within(() => {
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    // Sorting dropdown
    cy.get('[data-test=sorting-type-dropdown]').within(() => {
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    cy.intercept('GET', 'api/v1/rooms*', { fixture: 'exampleRooms.json' });
    // Check if reload button exists and click it
    cy.get('[data-test=reload-button]').should('include.text', 'app.reload').click();

    // Check if rooms are shown and contain the correct data
    cy.get('[data-test="room-card"]').as('rooms').should('have.length', 3);

    cy.get('[data-test="room-card"]').eq(0).should('include.text', 'Meeting One');
    cy.get('[data-test="room-card"]').eq(1).should('include.text', 'Meeting Two');
    cy.get('[data-test="room-card"]').eq(2).should('include.text', 'Meeting Three');

    // Check that reload button does not exist
    cy.get('[data-test=reload-button]').should('not.exist');

    // Check that components are not disabled
    // Room search field
    cy.get('[data-test=room-search]').eq(0).within(() => {
      cy.get('.p-inputtext').should('not.be.disabled');
      cy.get('.p-button').should('not.be.disabled');
    });

    // Only favorites button
    cy.get('[data-test=only-favorites-button]').should('not.be.disabled');

    // Room type dropdown
    cy.get('[data-test=room-type-dropdown]').within(() => {
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });

    // Sorting dropdown
    cy.get('[data-test=sorting-type-dropdown]').within(() => {
      cy.get('.p-select-label').should('not.have.attr', 'aria-disabled', 'true');
    });
  });

  it('error loading room types', function () {
    cy.intercept('GET', 'api/v1/roomTypes', {
      statusCode: 500,
      body: {
        message: 'Test'
      }
    });

    cy.visit('/rooms');

    // Check that error message gets shown
    cy.get('.p-toast-message')
      .should('be.visible')
      .should('include.text', 'app.flash.server_error.message_{"message":"Test"}')
      .should('include.text', 'app.flash.server_error.error_code_{"statusCode":500}');

    const roomTypeInterception = interceptIndefinitely('GET', 'api/v1/roomTypes*', { fixture: 'exampleRoomTypes.json' });

    // Check that room type select is shown correctly and click on reload button
    cy.get('[data-test=room-type-dropdown').should('not.exist');
    cy.get('[data-test=room-type-inputgroup]').should('include.text', 'rooms.room_types.loading_error').within(() => {
      cy.get('.p-button').click();
      // Check that button is disabled after click
      cy.get('.p-button').should('be.disabled').and('have.class', 'p-button-loading').then(() => {
        // Send correct response and check that reload button does not exist after reload
        roomTypeInterception.sendResponse();
        cy.get('.p-button').should('not.exist');
      });
    });

    // Check that dropdown exists and error message is not shown after correct response
    cy.get('[data-test=room-type-dropdown');
    cy.get('[data-test=room-type-inputgroup]').should('not.include.text', 'rooms.room_types.loading_error');
  });
})
;
