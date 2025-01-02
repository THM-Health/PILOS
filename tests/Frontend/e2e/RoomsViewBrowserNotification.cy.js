import {
  createAudioNotificationFaker,
  createNotificationFaker,
} from "../support/utils/notificationFaker.js";

describe("Rooms view browser notification", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
  });

  it("enable notifications with granted permission", function () {
    cy.visit("/rooms/abc-def-123", {
      onBeforeLoad(win) {
        cy.stub(win.Notification, "permission").value("granted");
        cy.stub(win, "Notification").as("notification");
      },
    });

    // Check that enable button is shown and enable notifications
    cy.get('[data-test="room-notification-button"]')
      .should("be.visible")
      .and("have.attr", "aria-label", "rooms.notification.enable")
      .click();

    // Check that success message is shown and button is changed
    cy.checkToastMessage("rooms.notification.enabled");

    cy.get('[data-test="room-notification-button"]').should(
      "have.attr",
      "aria-label",
      "rooms.notification.disable",
    );
  });

  it("enable notifications with denied permission", function () {
    cy.visit("/rooms/abc-def-123", {
      onBeforeLoad(win) {
        cy.stub(win.Notification, "permission").value("denied");
        cy.stub(win, "Notification").as("notification");
      },
    });

    // Check that enable button is shown and enable notifications
    cy.get('[data-test="room-notification-button"]')
      .should("be.visible")
      .and("have.attr", "aria-label", "rooms.notification.enable")
      .click();

    // Check that error message is shown and button is not changed
    cy.checkToastMessage("rooms.notification.denied");

    cy.get('[data-test="room-notification-button"]').should(
      "have.attr",
      "aria-label",
      "rooms.notification.enable",
    );
  });

  it("enable notification with default permission, but granted on request", function () {
    const notificationCloseSpy = cy.stub().as("notificationCloseSpy");
    const notificationFaker = createNotificationFaker(notificationCloseSpy);

    cy.visit("/rooms/abc-def-123", {
      onBeforeLoad(win) {
        cy.stub(win.Notification, "permission").value("default");
        cy.stub(win.Notification, "requestPermission")
          .as("requestPermission")
          .resolves("granted");
        cy.stub(win, "Notification")
          .as("notification")
          .callsFake(() => {
            return notificationFaker.createNotification();
          });
      },
    });

    // Check that test Notification is called and closed
    cy.get("@notification")
      .should("be.calledOnce")
      .and("be.calledWithNew")
      .and("be.calledWith", "");
    cy.get("@notificationCloseSpy").should("be.calledOnce");

    cy.get('[data-test="room-notification-button"]')
      .should("be.visible")
      .and("have.attr", "aria-label", "rooms.notification.enable")
      .click();

    cy.get("@requestPermission").should("be.calledOnce");

    // Check button is changed
    cy.checkToastMessage("rooms.notification.enabled");

    cy.get('[data-test="room-notification-button"]').should(
      "have.attr",
      "aria-label",
      "rooms.notification.disable",
    );
  });

  it("enable notification with default permission, but denied on request", function () {
    const notificationCloseSpy = cy.stub().as("notificationCloseSpy");
    const notificationFaker = createNotificationFaker(notificationCloseSpy);

    cy.visit("/rooms/abc-def-123", {
      onBeforeLoad(win) {
        cy.stub(win.Notification, "permission").value("default");
        cy.stub(win.Notification, "requestPermission")
          .as("requestPermission")
          .resolves("denied");
        cy.stub(win, "Notification")
          .as("notification")
          .callsFake(() => {
            return notificationFaker.createNotification();
          });
      },
    });

    // Check that test Notification is called and closed
    cy.get("@notification").should("be.calledOnce").and("be.calledWith", "");
    cy.get("@notificationCloseSpy").should("be.calledOnce");

    cy.get('[data-test="room-notification-button"]')
      .should("be.visible")
      .and("have.attr", "aria-label", "rooms.notification.enable")
      .click();

    cy.get("@requestPermission").should("be.calledOnce");

    // Check that error message is shown and button is not changed
    cy.checkToastMessage("rooms.notification.denied");

    cy.get('[data-test="room-notification-button"]').should(
      "have.attr",
      "aria-label",
      "rooms.notification.enable",
    );
  });

  it("hide enable button if not supported by browser", function () {
    cy.visit("/rooms/abc-def-123", {
      onBeforeLoad(win) {
        delete win.Notification;
      },
    });

    cy.wait("@roomRequest");

    cy.get('[data-test="room-notification-button"]').should("not.exist");
  });

  it("hide enable button if not fully supported", function () {
    cy.visit("/rooms/abc-def-123", {
      onBeforeLoad(win) {
        cy.stub(win.Notification, "permission").value("default");
        cy.stub(win, "Notification")
          .as("notification")
          .callsFake(() => {
            throw new TypeError("test");
          });
      },
    });

    cy.wait("@roomRequest");

    cy.get("@notification")
      .should("be.calledOnce")
      .and("be.calledWithNew")
      .and("be.calledWith", "");

    cy.get('[data-test="room-notification-button"]').should("not.exist");
  });

  it("change status from not running to running", function () {
    // Set date to 2017-01-01
    cy.clock(Date.UTC(2017, 1, 1), ["Date"]);

    cy.fixture("config.json").then((config) => {
      config.data.theme.favicon = "favicon.ico";

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    const notificationCloseSpy = cy.stub().as("notificationCloseSpy");
    const addEventListenerSpy = cy.stub().as("addEventListenerSpy");
    const playSpy = cy.stub().as("playSpy");
    const notificationFaker = createNotificationFaker(
      notificationCloseSpy,
      addEventListenerSpy,
    );

    const audioNotificationFaker = createAudioNotificationFaker(playSpy);

    cy.visit("/rooms/abc-def-123", {
      onBeforeLoad(win) {
        cy.stub(win, "focus").as("focus");
        cy.stub(win.Notification, "permission").value("granted");
        cy.stub(win, "Notification")
          .as("notification")
          .callsFake(() => {
            return notificationFaker.createNotification();
          });
        cy.stub(win, "Audio")
          .as("audioNotification")
          .callsFake(() => {
            return audioNotificationFaker.createAudioNotification();
          });
      },
    });

    // Enable notifications
    cy.get('[data-test="room-notification-button"]').click();
    cy.checkToastMessage("rooms.notification.enabled");

    // Reload room but room is running
    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="reload-room-button"]').click();
    cy.wait("@roomRequest");

    // Check that enable button is hidden
    cy.get('[data-test="room-notification-button"]').should("not.exist");

    // Check that notification is shown
    cy.get("@notification")
      .should("be.calledOnce")
      .and("be.calledWithNew")
      .and("be.calledWith", "Meeting One", {
        body: 'rooms.notification.body_{"time":"01:00"}',
        icon: "favicon.ico",
      });
    cy.get("@addEventListenerSpy")
      .should("be.calledOnce")
      .and("be.calledWith", 0, "click");
    cy.get("@audioNotification")
      .should("be.calledOnce")
      .and("be.calledWithNew")
      .and("be.calledWithMatch", ".mp3")
      .and("be.calledWithMatch", "notification");
    cy.get("@playSpy").should("be.calledOnce");

    // Reload room without running meeting
    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: "2023-08-21T09:18:28.000000Z",
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="reload-room-button"]').click();
    cy.wait("@roomRequest");

    // Check that notification is closed
    cy.get("@notificationCloseSpy")
      .should("be.calledOnce")
      .and("be.calledWith", 0);

    // Reload again with running meeting
    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="reload-room-button"]').click();
    cy.wait("@roomRequest");

    // Check that enable button is hidden
    cy.get('[data-test="room-notification-button"]').should("not.exist");

    // Check that notification is shown
    cy.get("@notification")
      .should("be.calledTwice")
      .and("be.calledWithNew")
      .and("be.calledWith", "Meeting One", {
        body: 'rooms.notification.body_{"time":"01:00"}',
        icon: "favicon.ico",
      });
    cy.get("@addEventListenerSpy")
      .should("be.calledTwice")
      .and("be.calledWith", 1, "click");
    cy.get("@audioNotification")
      .should("be.calledTwice")
      .and("be.calledWithNew")
      .and("be.calledWithMatch", ".mp3")
      .and("be.calledWithMatch", "notification");
    cy.get("@playSpy")
      .should("be.calledTwice")
      .then(() => {
        // Simulate clicking (call triggerClick)
        notificationFaker.triggerEvent(1, "click");
      });

    // Check that focus is called and notification is closed (correct function set with addEventListener)
    cy.get("@focus").should("be.calledOnce");
    cy.get("@notificationCloseSpy")
      .should("be.calledTwice")
      .and("be.calledWith", 1);

    // Reload room without running meeting
    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: "2023-08-21T09:18:28.000000Z",
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="reload-room-button"]').click();
    cy.wait("@roomRequest");

    // Disable notifications
    cy.get('[data-test="room-notification-button"]').click();
    // Check that button is changed, toast message is shown and notification is closed
    cy.get('[data-test="room-notification-button"]').should(
      "have.attr",
      "aria-label",
      "rooms.notification.enable",
    );
    cy.checkToastMessage("rooms.notification.disabled");
  });

  it("change status from not running to running errors", function () {
    cy.visit("/rooms/abc-def-123", {
      onBeforeLoad(win) {
        cy.stub(win.Notification, "permission").value("granted");
        cy.stub(win, "Notification")
          .as("notification")
          .callsFake(() => {
            throw new TypeError("test");
          });
      },
    });

    cy.get('[data-test="room-notification-button"]').click();

    cy.checkToastMessage("rooms.notification.enabled");

    // Reload room but room is running
    cy.fixture("room.json").then((room) => {
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="reload-room-button"]').click();

    cy.wait("@roomRequest");

    cy.checkToastMessage("rooms.notification.browser_support");

    cy.get('[data-test="room-notification-button"]').should("not.exist");
  });
});
