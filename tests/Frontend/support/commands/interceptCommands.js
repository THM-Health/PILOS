/**
 * Intercept requests that are needed when visiting pages that require a logged in user
 * @memberof cy
 * @method init
 * @returns void
 */
Cypress.Commands.add("init", () => {
  cy.intercept("GET", "api/v1/currentUser", { fixture: "currentUser.json" });
  cy.intercept("GET", "api/v1/locale/en", { fixture: "en.json" });

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

  cy.intercept("GET", "api/v1/users/1", {
    fixture: "userDataCurrentUser.json",
  }).as("userRequest");
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

/**
 * Intercept all requests that are needed when visiting the admin users index page
 * @memberof cy
 * @method interceptAdminUsersIndexRequests
 * @returns void
 */
Cypress.Commands.add("interceptAdminUsersIndexRequests", () => {
  cy.intercept("GET", "api/v1/users*", {
    fixture: "users.json",
  }).as("usersRequest");

  cy.intercept("GET", "api/v1/roles*", {
    fixture: "roles.json",
  });
});

/**
 * Intercept all requests that are needed when visiting the admin users new page
 * @memberof cy
 * @method interceptAdminUsersNewRequests
 * @returns void
 */
Cypress.Commands.add("interceptAdminUsersNewRequests", () => {
  cy.intercept("GET", "api/v1/roles*", {
    fixture: "roles.json",
  });

  cy.intercept("GET", "api/v1/getTimezones", { fixture: "timezones.json" });
});

/**
 * Intercept all requests that are needed when visiting the admin users view page
 * @memberof cy
 * @method interceptAdminUsersViewRequests
 * @returns void
 */
Cypress.Commands.add("interceptAdminUsersViewRequests", () => {
  cy.intercept("GET", "api/v1/users/2", {
    fixture: "userDataUser.json",
  }).as("userRequest");

  cy.intercept("GET", "api/v1/roles*", {
    fixture: "roles.json",
  });

  cy.intercept("GET", "api/v1/getTimezones", { fixture: "timezones.json" });
  cy.intercept("GET", "api/v1/sessions", { fixture: "sessions.json" });
});

/**
 * Intercept all requests that are needed when visiting the admin servers index page
 * @memberof cy
 * @method interceptAdminServersIndexRequests
 * @returns void
 */
Cypress.Commands.add("interceptAdminServersIndexRequests", () => {
  cy.intercept("GET", "api/v1/servers*", {
    fixture: "servers.json",
  }).as("serversRequest");
});

/**
 * Intercept all requests that are needed when visiting the admin servers view page
 * @memberof cy
 * @method interceptAdminServersViewRequests
 * @returns void
 */
Cypress.Commands.add("interceptAdminServersViewRequests", () => {
  cy.intercept("GET", "api/v1/servers/1*", {
    fixture: "server.json",
  }).as("serverRequest");
});

/**
 * Intercept all requests that are needed when visiting the admin server pools index page
 * @memberof cy
 * @method interceptAdminServerPoolsIndexRequests
 * @returns void
 */
Cypress.Commands.add("interceptAdminServerPoolsIndexRequests", () => {
  cy.intercept("GET", "api/v1/serverPools*", {
    fixture: "serverPools.json",
  }).as("serverPoolsRequest");
});

/**
 * Intercept all requests that are needed when visiting the admin server pools view page
 * @memberof cy
 * @method interceptAdminServerPoolsViewRequests
 * @returns void
 */
Cypress.Commands.add("interceptAdminServerPoolsViewRequests", () => {
  cy.intercept("GET", "api/v1/serverPools/1*", {
    fixture: "serverPool.json",
  }).as("serverPoolRequest");

  cy.intercept("GET", "api/v1/servers*", {
    fixture: "servers.json",
  }).as("serversRequest");
});

/**
 * Intercept all requests that are needed when visiting the admin server pools view page
 * @memberof cy
 * @method interceptAdminServerPoolsNewRequests
 * @returns void
 */
Cypress.Commands.add("interceptAdminServerPoolsNewRequests", () => {
  cy.intercept("GET", "api/v1/servers*", {
    fixture: "servers.json",
  }).as("serversRequest");
});

/**
 * Intercept all requests that are needed when visiting the admin room types index page
 * @memberof cy
 * @method interceptAdminRoomTypesIndexRequests
 * @returns void
 */
Cypress.Commands.add("interceptAdminRoomTypesIndexRequests", () => {
  cy.intercept("GET", "api/v1/roomTypes*", {
    fixture: "roomTypes.json",
  }).as("roomTypesRequest");
});

/**
 * Intercept all requests that are needed when visiting the admin room types view page
 * @memberof cy
 * @method interceptAdminRoomTypesViewRequests
 * @returns void
 */
Cypress.Commands.add("interceptAdminRoomTypesViewRequests", () => {
  cy.intercept("GET", "api/v1/roomTypes/3", {
    fixture: "roomType.json",
  }).as("roomTypeRequest");

  cy.intercept("GET", "api/v1/serverPools*", {
    fixture: "serverPools.json",
  }).as("serverPoolsRequest");

  cy.intercept("GET", "api/v1/roles*", {
    fixture: "roles.json",
  }).as("rolesRequest");
});

/**
 * Intercept all requests that are needed when visiting the admin room types new page
 * @memberof cy
 * @method interceptAdminRoomTypesNewRequests
 * @returns void
 */
Cypress.Commands.add("interceptAdminRoomTypesNewRequests", () => {
  cy.intercept("GET", "api/v1/serverPools*", {
    fixture: "serverPools.json",
  }).as("serverPoolsRequest");

  cy.intercept("GET", "api/v1/roles*", {
    fixture: "roles.json",
  }).as("rolesRequest");
});

/**
 * Intercept all requests that are needed when visiting the meetings index page
 * @memberof cy
 * @method interceptMeetingsIndexRequests
 * @returns void
 */
Cypress.Commands.add("interceptMeetingsIndexRequests", () => {
  cy.intercept("GET", "api/v1/meetings*", {
    fixture: "meetings.json",
  }).as("meetingsRequest");
});

/**
 * Intercept all requests that are needed when visiting the admin settings page
 * @memberof cy
 * @method interceptAdminSettingsRequest
 * @returns void
 */
Cypress.Commands.add("interceptAdminSettingsRequest", () => {
  cy.intercept("GET", "api/v1/settings", {
    fixture: "settings.json",
  }).as("settingsRequest");

  cy.intercept("GET", "api/v1/getTimezones", { fixture: "timezones.json" });
});

/**
 * Intercept all requests that are needed when visiting the admin roles index page
 * @memberof cy
 * @method interceptAdminRolesIndexRequests
 * @returns void
 */
Cypress.Commands.add("interceptAdminRolesIndexRequests", () => {
  cy.intercept("GET", "api/v1/roles*", {
    fixture: "roles.json",
  }).as("rolesRequest");
});

/**
 * Intercept all requests that are needed when visiting the admin roles view page
 * @memberof cy
 * @method interceptAdminRolesViewRequests
 * @returns void
 */
Cypress.Commands.add("interceptAdminRolesViewRequests", () => {
  cy.intercept("GET", "api/v1/roles/2", {
    fixture: "role.json",
  }).as("roleRequest");

  cy.intercept("GET", "api/v1/permissions", {
    fixture: "permissions.json",
  }).as("permissionsRequest");
});

/**
 * Intercept all requests that are needed when visiting the admin roles new page
 * @memberof cy
 * @method interceptAdminRolesNewRequests
 * @returns void
 */
Cypress.Commands.add("interceptAdminRolesNewRequests", () => {
  cy.intercept("GET", "api/v1/permissions", {
    fixture: "permissions.json",
  }).as("permissionsRequest");
});
