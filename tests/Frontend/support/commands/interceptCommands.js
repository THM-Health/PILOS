/**
 * Intercept requests that are needed when visiting pages that require a logged in user
 * @memberof cy
 * @method init
 * @returns void
 */
Cypress.Commands.add("init", () => {
  cy.intercept("GET", "api/v1/currentUser", { fixture: "currentUser.json" });
  cy.intercept("GET", "api/v1/locale/en", {
    data: {},
    meta: {
      dateTimeFormat: {
        dateShort: {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        },
        dateLong: {
          year: "numeric",
          month: "short",
          day: "2-digit",
        },
        time: {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        },
        datetimeShort: {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        },
        datetimeLong: {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        },
      },
    },
  });

  cy.fixture("config.json").then((config) => {
    config.data.general.base_url = Cypress.config("baseUrl");

    cy.intercept("GET", "api/v1/config", {
      statusCode: 200,
      body: config,
    });
  });
});

/**
 * Intercept all requests that are needed when visiting the room index page
 * @memberof cy
 * @method interceptRoomIndexRequests
 * @returns void
 */
Cypress.Commands.add("interceptRoomIndexRequests", () => {
  cy.intercept("GET", "api/v1/roomTypes*", { fixture: "roomTypes.json" });
  cy.intercept("GET", "api/v1/rooms*", { fixture: "rooms.json" }).as(
    "roomRequest",
  );
});

/**
 * Intercept all requests that are needed when visiting the room view page (rooms/abc-def-123)
 * @memberof cy
 * @method interceptRoomViewRequests
 * @returns void
 */
Cypress.Commands.add("interceptRoomViewRequests", () => {
  cy.intercept("GET", "api/v1/rooms/abc-def-123", { fixture: "room.json" }).as(
    "roomRequest",
  );
});

/**
 * Intercept all requests that are needed when visiting the files tab of a room (rooms/abc-def-123)
 * @memberof cy
 * @method interceptRoomFilesRequest
 * @param  {boolean} [withFileDetails=false]
 * @returns void
 */
Cypress.Commands.add("interceptRoomFilesRequest", (withFileDetails = false) => {
  if (withFileDetails) {
    cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
      fixture: "roomFiles.json",
    }).as("roomFilesRequest");
  } else {
    cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
      fixture: "roomFilesNoDetails.json",
    }).as("roomFilesRequest");
  }
});

/**
 * Intercept all requests that are needed when visiting the members tab of a room (rooms/abc-def-123)
 * @memberof cy
 * @method interceptRoomMembersRequest
 * @returns void
 */
Cypress.Commands.add("interceptRoomMembersRequest", () => {
  cy.intercept("GET", "api/v1/rooms/abc-def-123/member*", {
    fixture: "roomMembers.json",
  }).as("roomMembersRequest");
});

/**
 * Intercept all requests that are needed when visiting the settings tab of a room (rooms/abc-def-123)
 * @memberof cy
 * @method interceptRoomSettingsRequest
 * @returns void
 */
Cypress.Commands.add("interceptRoomSettingsRequest", () => {
  cy.intercept("GET", "api/v1/rooms/abc-def-123/settings", {
    fixture: "roomSettings.json",
  }).as("roomSettingsRequest");
});

/**
 * Intercept all requests that are needed when visiting the user profile page
 * @memberof cy
 * @method interceptUserProfileRequests
 * @returns void
 */
Cypress.Commands.add("interceptUserProfileRequests", () => {
  cy.fixture("currentUser.json").then((currentUser) => {
    currentUser.data.permissions = ["users.updateOwnAttributes"];

    cy.intercept("GET", "api/v1/currentUser", currentUser);
  });

  cy.intercept("GET", "api/v1/users/1", { fixture: "user.json" }).as(
    "userRequest",
  );
  cy.intercept("GET", "api/v1/getTimezones", { fixture: "timezones.json" });
  cy.intercept("GET", "api/v1/sessions", { fixture: "sessions.json" });
});

/**
 * Intercept all requests that are needed when visiting the recordings tab of a room (rooms/abc-def-123)
 * @memberof cy
 * @method interceptRoomRecordingsRequests
 * @returns void
 */
Cypress.Commands.add("interceptRoomRecordingsRequests", () => {
  cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
    fixture: "roomRecordings.json",
  }).as("roomRecordingsRequest");
});

/**
 * Intercept all requests that are needed when visiting the history tab of a room (rooms/abc-def-123)
 * @memberof cy
 * @method interceptRoomHistoryRequests
 * @returns void
 */
Cypress.Commands.add("interceptRoomHistoryRequests", () => {
  cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
    fixture: "roomHistory.json",
  }).as("roomHistoryRequest");
});

/**
 * Intercept all requests that are needed when visiting the token/personalized links tab of a room (rooms/abc-def-123)
 * @memberof cy
 * @method interceptRoomPersonalizedLinksRequests
 * @returns void
 */
Cypress.Commands.add("interceptRoomPersonalizedLinksRequests", () => {
  cy.intercept("GET", "api/v1/rooms/abc-def-123/tokens*", {
    fixture: "roomTokens.json",
  }).as("roomTokensRequest");
});
