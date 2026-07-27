describe("Room Join with lobby settings", function () {
  beforeEach(function () {
    cy.seed();
  });

  it("Lobby disabled", function () {
    // Login as owner of the room to configure lobby to disabled
    cy.loginAs("daniel");
    cy.visit("/rooms/abc-def-123");
    cy.get("#tab-settings").click();
    cy.get('[data-test="clear-access-code-button"]').click();
    cy.get("#room-setting-allow_guests").click();
    cy.get("#room-setting-lobby-0").click();
    cy.get('[data-test="room-settings-save-button"]').click();

    // Find start button and click it, join as owner
    cy.get('[data-test="room-start-button"]').click();

    cy.origin(`${Cypress.expose("BBB_TEST_SERVER_HOST")}`, () => {
      cy.get('[data-test="audioModal"]', { timeout: 30000 }).should(
        "be.visible",
      );
    });

    // Logout
    cy.visit("/");
    cy.get('[data-test="navbar-user"]').click();
    cy.get('[data-test="navbar-user-logout"]').click();

    // Re-login as another user to join the meeting
    cy.loginAs("hoyt");
    cy.visit("/rooms/abc-def-123");

    // Find join button and click it, join as user
    cy.get('[data-test="room-join-button"]').click();

    cy.origin(`${Cypress.expose("BBB_TEST_SERVER_HOST")}`, () => {
      cy.get('[data-test="audioModal"]', { timeout: 30000 }).should(
        "be.visible",
      );
    });

    // Logout
    cy.visit("/");
    cy.get('[data-test="navbar-user"]').click();
    cy.get('[data-test="navbar-user-logout"]').click();

    // Re-login as another user to join the meeting
    cy.loginAs("william");
    cy.visit("/rooms/abc-def-123");

    // Find join button and click it, join as moderator
    cy.get('[data-test="room-join-button"]').click();

    cy.origin(`${Cypress.expose("BBB_TEST_SERVER_HOST")}`, () => {
      cy.get('[data-test="audioModal"]', { timeout: 30000 }).should(
        "be.visible",
      );
    });

    // Logout
    cy.visit("/");
    cy.get('[data-test="navbar-user"]').click();
    cy.get('[data-test="navbar-user-logout"]').click();

    cy.visit("/rooms/abc-def-123");

    // Find join button and click it, join as guest
    cy.get('[data-test="room-join-button"]').click();
    cy.get("#guest-name").type("John Doe");
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.origin(`${Cypress.expose("BBB_TEST_SERVER_HOST")}`, () => {
      cy.get('[data-test="audioModal"]', { timeout: 30000 }).should(
        "be.visible",
      );
    });
  });

  it("Lobby enabled", function () {
    // Login as owner of the room to configure lobby to enabled
    cy.loginAs("daniel");
    cy.visit("/rooms/abc-def-123");
    cy.get("#tab-settings").click();
    cy.get('[data-test="clear-access-code-button"]').click();
    cy.get("#room-setting-allow_guests").click();
    cy.get("#room-setting-lobby-1").click();
    cy.get('[data-test="room-settings-save-button"]').click();

    // Find start button and click it, join as owner
    cy.get('[data-test="room-start-button"]').click();

    cy.origin(`${Cypress.expose("BBB_TEST_SERVER_HOST")}`, () => {
      cy.get('[data-test="audioModal"]', { timeout: 30000 }).should(
        "be.visible",
      );
    });

    // Logout
    cy.visit("/");
    cy.get('[data-test="navbar-user"]').click();
    cy.get('[data-test="navbar-user-logout"]').click();

    // Re-login as another user to join the meeting
    cy.loginAs("hoyt");
    cy.visit("/rooms/abc-def-123");

    // Find join button and click it, join as user
    cy.get('[data-test="room-join-button"]').click();

    cy.origin(`${Cypress.expose("BBB_TEST_SERVER_HOST")}`, () => {
      cy.get('[data-test="guestMessage"]', { timeout: 30000 }).should(
        "be.visible",
      );
    });

    // Logout
    cy.visit("/");
    cy.get('[data-test="navbar-user"]').click();
    cy.get('[data-test="navbar-user-logout"]').click();

    // Re-login as another user to join the meeting
    cy.loginAs("william");
    cy.visit("/rooms/abc-def-123");

    // Find join button and click it, join as moderator
    cy.get('[data-test="room-join-button"]').click();

    cy.origin(`${Cypress.expose("BBB_TEST_SERVER_HOST")}`, () => {
      cy.get('[data-test="audioModal"]', { timeout: 30000 }).should(
        "be.visible",
      );
    });

    // Logout
    cy.visit("/");
    cy.get('[data-test="navbar-user"]').click();
    cy.get('[data-test="navbar-user-logout"]').click();

    cy.visit("/rooms/abc-def-123");

    // Find join button and click it, join as guest
    cy.get('[data-test="room-join-button"]').click();
    cy.get("#guest-name").type("John Doe");
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.origin(`${Cypress.expose("BBB_TEST_SERVER_HOST")}`, () => {
      cy.get('[data-test="guestMessage"]', { timeout: 30000 }).should(
        "be.visible",
      );
    });
  });

  it("Lobby enabled for guests only", function () {
    // Login as owner of the room to configure lobby to enabled for guests only
    cy.loginAs("daniel");
    cy.visit("/rooms/abc-def-123");
    cy.get("#tab-settings").click();
    cy.get('[data-test="clear-access-code-button"]').click();
    cy.get("#room-setting-allow_guests").click();
    cy.get("#room-setting-lobby-2").click();
    cy.get('[data-test="room-settings-save-button"]').click();

    // Find start button and click it, join as owner
    cy.get('[data-test="room-start-button"]').click();

    cy.origin(`${Cypress.expose("BBB_TEST_SERVER_HOST")}`, () => {
      cy.get('[data-test="audioModal"]', { timeout: 30000 }).should(
        "be.visible",
      );
    });

    // Logout
    cy.visit("/");
    cy.get('[data-test="navbar-user"]').click();
    cy.get('[data-test="navbar-user-logout"]').click();

    // Re-login as another user to join the meeting
    cy.loginAs("hoyt");
    cy.visit("/rooms/abc-def-123");

    // Find join button and click it, join as user
    cy.get('[data-test="room-join-button"]').click();

    cy.origin(`${Cypress.expose("BBB_TEST_SERVER_HOST")}`, () => {
      cy.get('[data-test="audioModal"]', { timeout: 30000 }).should(
        "be.visible",
      );
    });

    // Logout
    cy.visit("/");
    cy.get('[data-test="navbar-user"]').click();
    cy.get('[data-test="navbar-user-logout"]').click();

    // Re-login as another user to join the meeting
    cy.loginAs("william");
    cy.visit("/rooms/abc-def-123");

    // Find join button and click it, join as moderator
    cy.get('[data-test="room-join-button"]').click();

    cy.origin(`${Cypress.expose("BBB_TEST_SERVER_HOST")}`, () => {
      cy.get('[data-test="audioModal"]', { timeout: 30000 }).should(
        "be.visible",
      );
    });

    // Logout
    cy.visit("/");
    cy.get('[data-test="navbar-user"]').click();
    cy.get('[data-test="navbar-user-logout"]').click();

    cy.visit("/rooms/abc-def-123");

    // Find join button and click it, join as guest
    cy.get('[data-test="room-join-button"]').click();
    cy.get("#guest-name").type("John Doe");
    cy.get('[data-test="dialog-continue-button"]').click();

    cy.origin(`${Cypress.expose("BBB_TEST_SERVER_HOST")}`, () => {
      cy.get('[data-test="guestMessage"]', { timeout: 30000 }).should(
        "be.visible",
      );
    });
  });
});
