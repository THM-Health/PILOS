import { interceptIndefinitely } from "../utils/interceptIndefinitely.js";

/**
 * Check if a room setting field inside the room type details view is displayed correctly
 * @memberof cy
 * @method checkDefaultRoomSettingField
 * @param  {string} field
 * @param  {(boolean|string)} value
 * @param  {boolean} enforced
 * @param  {boolean} isInfo
 * @returns void
 */
Cypress.Commands.add(
  "checkDefaultRoomSettingField",
  (field, value, enforced, isInfo) => {
    cy.get('[data-test="room-type-' + field + '-setting"]').within(() => {
      if (enforced) {
        cy.get('[data-test="room-setting-enforced-icon"]');
      } else {
        cy.get('[data-test="room-setting-enforced-icon"]').should("not.exist");
      }
      if (isInfo) {
        cy.get('[data-test="room-type-setting-enabled-icon"]').should(
          "not.exist",
        );
        cy.get('[data-test="room-type-setting-disabled-icon"]').should(
          "not.exist",
        );
        cy.get('[data-test="room-type-setting-info"]').should(
          "have.text",
          value,
        );
      } else {
        if (value) {
          cy.get('[data-test="room-type-setting-enabled-icon"]');
          cy.get('[data-test="room-type-setting-disabled-icon"]').should(
            "not.exist",
          );
        } else {
          cy.get('[data-test="room-type-setting-enabled-icon"]').should(
            "not.exist",
          );
          cy.get('[data-test="room-type-setting-disabled-icon"]');
        }
        cy.get('[data-test="room-setting-info-icon"]').should("not.exist");
      }
    });
  },
);

/**
 * Check if the comparison between the current and new value for a room setting field is displayed correctly
 * inside the confirmation dialog
 * @memberof cy
 * @method checkCompareRoomSettingField
 * @param  {string} field
 * @param  {(boolean|string)} currentValue
 * @param  {boolean} currentEnforced
 * @param  {(boolean|string)} newValue
 * @param  {boolean} newEnforced
 * @param  {boolean} isInfo
 * @returns void
 */
Cypress.Commands.add(
  "checkCompareRoomSettingField",
  (field, currentValue, currentEnforced, newValue, newEnforced, isInfo) => {
    cy.get('[data-test="room-type-' + field + '-comparison"]').within(() => {
      if (currentEnforced) {
        cy.get(
          '[data-test="current-enforced"] > [data-test="room-setting-enforced-icon"]',
        );
      } else {
        cy.get(
          '[data-test="current-enforced"] > [data-test="room-setting-enforced-icon"]',
        ).should("not.exist");
      }
      if (newEnforced) {
        cy.get(
          '[data-test="new-enforced"] > [data-test="room-setting-enforced-icon"]',
        );
      } else {
        cy.get(
          '[data-test="new-enforced"] > [data-test="room-setting-enforced-icon"]',
        ).should("not.exist");
      }
      if (isInfo) {
        cy.get('[data-test="current-enabled"]').should("not.exist");
        cy.get('[data-test="current-disabled"]').should("not.exist");
        cy.get('[data-test="current-info"]').should("have.text", currentValue);
        cy.get('[data-test="new-enabled"]').should("not.exist");
        cy.get('[data-test="new-disabled"]').should("not.exist");
        cy.get('[data-test="new-info"]').should("have.text", newValue);
      } else {
        if (currentValue) {
          cy.get('[data-test="current-enabled"]');
          cy.get('[data-test="current-disabled"]').should("not.exist");
        } else {
          cy.get('[data-test="current-enabled"]').should("not.exist");
          cy.get('[data-test="current-disabled"]');
        }
        if (newValue) {
          cy.get('[data-test="new-enabled"]');
          cy.get('[data-test="new-disabled"]').should("not.exist");
        } else {
          cy.get('[data-test="new-enabled"]').should("not.exist");
          cy.get('[data-test="new-disabled"]');
        }
        cy.get('[data-test="current-info"]').should("not.exist");
        cy.get('[data-test="new-info"]').should("not.exist");
      }
    });
  },
);

/**
 * Check that the auth errors are handled correctly when loading a room tab
 * @memberof cy
 * @method checkRoomAuthErrorsLoadingTab
 * @param  {string} requestMethod
 * @param  {string} requestUrl
 * @param  {string} roomTabName
 * @returns void
 */
Cypress.Commands.add(
  "checkRoomAuthErrorsLoadingTab",
  (requestMethod, requestUrl, roomTabName) => {
    cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
      fixture: "roomFiles.json",
    }).as("roomFilesRequestAuthErrorsLoadingTab");
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequestAuthErrorsLoadingTab");

    const request1 = interceptIndefinitely(
      requestMethod,
      requestUrl,
      {
        statusCode: 401,
      },
      "requestAuthErrorsLoadingTab",
    );

    cy.visit("/rooms/abc-def-123#tab=" + roomTabName);
    cy.reload();
    cy.wait("@roomRequestAuthErrorsLoadingTab").then(() => {
      cy.fixture("room.json").then((room) => {
        room.data.current_user = null;

        cy.intercept("GET", "api/v1/rooms/abc-def-123", {
          statusCode: 200,
          body: room,
        }).as("roomRequestAuthErrorsLoadingTab");
      });

      request1.sendResponse();
    });

    // Check that room gets reloaded
    cy.wait("@requestAuthErrorsLoadingTab");
    cy.wait("@roomRequestAuthErrorsLoadingTab");

    // Check that file tab is shown
    cy.wait("@roomFilesRequestAuthErrorsLoadingTab");
    cy.url().should("not.include", "#tab=" + roomTabName);
    cy.url().should("include", "/rooms/abc-def-123#tab=files");

    // Check that toast message is shown and user is logged out
    cy.checkToastMessage("app.flash.unauthenticated");
    cy.contains("auth.login").should("be.visible");

    // Reload with logged in user
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequestAuthErrorsLoadingTab");

    cy.reload();
    cy.wait("@roomRequestAuthErrorsLoadingTab");
    cy.wait("@roomFilesRequestAuthErrorsLoadingTab");

    // Check with 401 errors but room has an access code
    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequestAuthErrorsLoadingTab");
    });

    cy.get("#tab-" + roomTabName).click();

    cy.wait("@requestAuthErrorsLoadingTab");

    // Check that room gets reloaded
    cy.wait("@roomRequestAuthErrorsLoadingTab");

    // Check that access code overlay is shown
    cy.get('[data-test="room-access-code-overlay"]').should("be.visible");

    // Check that error message is shown
    cy.checkToastMessage("app.flash.unauthenticated");
    cy.contains("auth.login").should("be.visible");

    // Check with 401 error but guests are forbidden
    // Reload with logged in user
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequestAuthErrorsLoadingTab");

    const request2 = interceptIndefinitely(
      requestMethod,
      requestUrl,
      {
        statusCode: 401,
      },
      "requestAuthErrorsLoadingTab",
    );

    cy.reload();
    cy.wait("@roomRequestAuthErrorsLoadingTab").then(() => {
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 403,
        body: {
          message: "guests_not_allowed",
        },
      }).as("roomRequestAuthErrorsLoadingTab");

      request2.sendResponse();
    });

    cy.wait("@requestAuthErrorsLoadingTab");
    cy.wait("@roomRequestAuthErrorsLoadingTab");

    cy.contains("rooms.only_used_by_authenticated_users").should("be.visible");
    cy.checkToastMessage("app.flash.unauthenticated");
    cy.contains("auth.login").should("be.visible");

    // Check with 403 error
    // Reload with logged in user
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequestAuthErrorsLoadingTab");

    const request3 = interceptIndefinitely(
      requestMethod,
      requestUrl,
      {
        statusCode: 403,
        body: {
          message: "This action is unauthorized.",
        },
      },
      "requestAuthErrorsLoadingTab",
    );

    cy.reload();
    cy.wait("@roomRequestAuthErrorsLoadingTab").then(() => {
      cy.fixture("room.json").then((room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.is_member = true;

        cy.intercept("GET", "api/v1/rooms/abc-def-123", {
          statusCode: 200,
          body: room,
        }).as("roomRequestAuthErrorsLoadingTab");
      });
      request3.sendResponse();
    });

    cy.wait("@requestAuthErrorsLoadingTab");

    // Check that room gets reloaded
    cy.wait("@roomRequestAuthErrorsLoadingTab");

    // Check that file tab is shown
    cy.wait("@roomFilesRequestAuthErrorsLoadingTab");

    cy.url().should("not.include", "#tab=" + roomTabName);
    cy.url().should("include", "/rooms/abc-def-123#tab=files");

    // Check that toast message is shown
    cy.checkToastMessage("app.flash.unauthorized");
  },
);

/**
 * Check that the auth errors for room actions are handled correctly for the given request actions
 * @memberof cy
 * @method checkRoomAuthErrors
 * @param  {function} triggerRequestActions
 * @param  {string} requestMethod
 * @param  {string} requestUrl
 * @param  {string} roomTabName
 * @returns void
 */
Cypress.Commands.add(
  "checkRoomAuthErrors",
  (triggerRequestActions, requestMethod, requestUrl, roomTabName) => {
    cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
      fixture: "roomFiles.json",
    }).as("roomFilesRequestCheckRoomAuthErrors");

    if (roomTabName === "recordings") {
      cy.intercept("GET", "api/v1/rooms/abc-def-123/recordings*", {
        fixture: "roomRecordings.json",
      }).as("roomRecordingsRequestCheckRoomAuthErrors");
    }

    // Check with 401 errors and room that has no access code
    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;
      if (roomTabName === "description") {
        room.data.description = "<p>Room description</p>";
      }

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequestCheckRoomAuthErrors");
    });

    cy.intercept(requestMethod, requestUrl, {
      statusCode: 401,
    }).as("requestCheckRoomAuthErrors");

    triggerRequestActions();

    cy.wait("@requestCheckRoomAuthErrors");

    // Check that room gets reloaded
    cy.wait("@roomRequestCheckRoomAuthErrors");

    switch (roomTabName) {
      case "description":
        // Check that tab stayed the same
        cy.url().should("not.include", "/rooms/abc-def-123#tab=files");
        cy.contains("rooms.description.title");
        break;
      case "files":
        // Check reload of files and check that tab stayed the same
        cy.wait("@roomFilesRequestCheckRoomAuthErrors");
        cy.url().should("include", "/rooms/abc-def-123#tab=files");
        break;
      case "recordings":
        // Check that tab stayed the same
        cy.wait("@roomRecordingsRequestCheckRoomAuthErrors");
        cy.url().should("include", "/rooms/abc-def-123#tab=recordings");
        break;
      default:
        // Check that file tab is shown
        cy.wait("@roomFilesRequestCheckRoomAuthErrors");
        cy.url().should("not.include", "#tab=" + roomTabName);
        cy.url().should("include", "/rooms/abc-def-123#tab=files");
    }

    // Check that toast message is shown and user is logged out
    cy.checkToastMessage("app.flash.unauthenticated");
    cy.contains("auth.login").should("be.visible");

    // Reload with logged in user
    cy.fixture("room.json").then((room) => {
      if (roomTabName === "description") {
        room.data.description = "<p>Room description</p>";
      }

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequestCheckRoomAuthErrors");
    });

    cy.visit("/rooms/abc-def-123#tab=" + roomTabName);
    cy.reload();
    cy.wait("@roomRequestCheckRoomAuthErrors");

    // Check with 401 errors but room has an access code
    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;
      room.data.authenticated = false;
      if (roomTabName === "description") {
        room.data.description = "<p>Room description</p>";
      }

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequestCheckRoomAuthErrors");
    });

    triggerRequestActions();

    cy.wait("@requestCheckRoomAuthErrors");

    // Check that room gets reloaded
    cy.wait("@roomRequestCheckRoomAuthErrors");

    // Check that access code overlay is shown
    cy.get('[data-test="room-access-code-overlay"]').should("be.visible");

    // Check that error message is shown and user is logged out
    cy.checkToastMessage("app.flash.unauthenticated");
    cy.contains("auth.login").should("be.visible");

    // Reload with logged in user
    cy.fixture("room.json").then((room) => {
      if (roomTabName === "description") {
        room.data.description = "<p>Room description</p>";
      }

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequestCheckRoomAuthErrors");
    });

    cy.reload();
    cy.wait("@roomRequestCheckRoomAuthErrors");

    // Check with 401 error but guests are forbidden
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 403,
      body: {
        message: "guests_not_allowed",
      },
    }).as("roomRequestCheckRoomAuthErrors");

    triggerRequestActions();

    cy.wait("@requestCheckRoomAuthErrors");

    // Check that room gets reloaded
    cy.wait("@roomRequestCheckRoomAuthErrors");

    // Check that the error message is shown
    cy.contains("rooms.only_used_by_authenticated_users").should("be.visible");
    cy.checkToastMessage("app.flash.unauthenticated");
    cy.contains("auth.login").should("be.visible");

    // Reload with logged in user
    cy.fixture("room.json").then((room) => {
      if (roomTabName === "description") {
        room.data.description = "<p>Room description</p>";
      }

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequestCheckRoomAuthErrors");
    });

    cy.reload();

    cy.wait("@roomRequestCheckRoomAuthErrors");

    // Check with 403 error
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.is_member = true;
      if (roomTabName === "description") {
        room.data.description = "<p>Room description</p>";
      }

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequestCheckRoomAuthErrors");
    });

    cy.intercept(requestMethod, requestUrl, {
      statusCode: 403,
      body: {
        message: "This action is unauthorized.",
      },
    }).as("requestCheckRoomAuthErrors");

    triggerRequestActions();

    cy.wait("@requestCheckRoomAuthErrors");

    // Check that room gets reloaded
    cy.wait("@roomRequestCheckRoomAuthErrors");

    switch (roomTabName) {
      case "description":
        // Check that tab stayed the same
        cy.url().should("not.include", "/rooms/abc-def-123#tab=files");
        cy.contains("rooms.description.title");
        break;
      case "files":
        // Check reload of files and check that tab stayed the same
        cy.wait("@roomFilesRequestCheckRoomAuthErrors");
        cy.url().should("include", "/rooms/abc-def-123#tab=files");
        break;
      case "recordings":
        // Check that tab stayed the same
        cy.wait("@roomRecordingsRequestCheckRoomAuthErrors");
        cy.url().should("include", "/rooms/abc-def-123#tab=recordings");
        break;
      default:
        // Check that file tab is shown
        cy.wait("@roomFilesRequestCheckRoomAuthErrors");
        cy.url().should("not.include", "#tab=" + roomTabName);
        cy.url().should("include", "/rooms/abc-def-123#tab=files");
    }

    // Check that toast message is shown
    cy.checkToastMessage("app.flash.unauthorized");
  },
);
