import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Rooms view history", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomHistoryRequests();
  });

  it("load history", function () {
    cy.clock(Date.UTC(2021, 5, 25), ["Date"]);

    const roomHistoryRequest = interceptIndefinitely(
      "GET",
      "api/v1/rooms/abc-def-123/meetings*",
      { fixture: "roomHistory.json" },
      "roomHistoryRequest",
    );
    cy.visit("/rooms/abc-def-123");

    cy.get("#tab-history").click();

    cy.url().should("include", "/rooms/abc-def-123#tab=history");

    // Check loading
    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    cy.get('[data-test="sorting-type-inputgroup"]').within(() => {
      cy.get('[data-test="sorting-type-dropdown"]').within(() => {
        cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
      });

      cy.get("button").should("be.disabled");
    });

    cy.get('[data-test="room-history-reload-button"]')
      .should("be.disabled")
      .then(() => {
        roomHistoryRequest.sendResponse();
      });

    cy.wait("@roomHistoryRequest");

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that laoding is done
    cy.get('[data-test="sorting-type-inputgroup"]').within(() => {
      cy.get('[data-test="sorting-type-dropdown"]').within(() => {
        cy.get(".p-select-label").should(
          "not.have.attr",
          "aria-disabled",
          "true",
        );
      });

      cy.get("button").should("not.be.disabled");
    });

    cy.get('[data-test="room-history-reload-button"]').should(
      "not.be.disabled",
    );

    // Check that history is displayed correctly
    cy.get('[data-test="room-history-item"]').should("have.length", 5);

    cy.get('[data-test="room-history-item"]')
      .eq(0)
      .should("include.text", "06/22/2021, 13:05")
      .should(
        "include.text",
        "2 app.time_formats.days, 12 app.time_formats.hours, 54 app.time_formats.minutes",
      )
      .within(() => {
        cy.get('[data-test="room-history-statistic-button"]').should(
          "not.exist",
        );
        cy.get('[data-test="room-history-attendance-button"]').should(
          "not.exist",
        );
      });

    cy.get('[data-test="room-history-item"]')
      .eq(1)
      .should("include.text", "06/23/2021, 12:04")
      .should("include.text", "1 app.time_formats.minute")
      .within(() => {
        cy.get('[data-test="room-history-statistic-button"]').should(
          "not.exist",
        );
        cy.get('[data-test="room-history-attendance-button"]').should(
          "not.exist",
        );
      });

    cy.get('[data-test="room-history-item"]')
      .eq(2)
      .should("include.text", "07/22/2021, 11:45")
      .should("include.text", "1 app.time_formats.minute")
      .within(() => {
        cy.get('[data-test="room-history-statistic-button"]').should(
          "not.exist",
        );
        cy.get('[data-test="room-history-attendance-button"]').should(
          "be.visible",
        );
      });

    cy.get('[data-test="room-history-item"]')
      .eq(3)
      .should("include.text", "06/22/2020, 10:51")
      .should("include.text", "10 app.time_formats.seconds")
      .within(() => {
        cy.get('[data-test="room-history-statistic-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-history-attendance-button"]').should(
          "not.exist",
        );
      });

    cy.get('[data-test="room-history-item"]')
      .eq(4)
      .should("include.text", "06/18/2021, 09:12")
      .should("include.text", "3 app.time_formats.minutes")
      .within(() => {
        cy.get('[data-test="room-history-statistic-button"]').should(
          "be.visible",
        );
        cy.get('[data-test="room-history-attendance-button"]').should(
          "be.visible",
        );
      });

    // Check that retention period message is shown
    cy.get('[data-test="retention-period-message"]')
      .should("include.text", "meetings.retention_period")
      .and("include.text", "meetings.stats.retention_period_unlimited")
      .and("include.text", "meetings.attendance.retention_period_unlimited");

    // Reload history with no data
    cy.fixture("roomHistory.json").then((roomHistory) => {
      roomHistory.data = [];
      roomHistory.meta.from = null;
      roomHistory.meta.to = null;
      roomHistory.meta.total = 0;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
        statusCode: 200,
        body: roomHistory,
      }).as("roomHistoryRequest");
    });

    cy.get('[data-test="room-history-reload-button"]').click();

    cy.wait("@roomHistoryRequest");

    cy.get('[data-test="room-history-item"]').should("have.length", 0);

    cy.contains("meetings.no_historical_data").should("be.visible");
  });

  it("load history errors", function () {
    cy.clock(Date.UTC(2021, 5, 25), ["Date"]);

    cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomHistoryRequest");

    cy.visit("/rooms/abc-def-123#tab=history");

    cy.wait("@roomRequest");
    cy.wait("@roomHistoryRequest");

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that components are not disabled
    cy.get('[data-test="sorting-type-inputgroup"]').within(() => {
      cy.get('[data-test="sorting-type-dropdown"]').within(() => {
        cy.get(".p-select-label").should(
          "not.have.attr",
          "aria-disabled",
          "true",
        );
      });

      cy.get("button").should("not.be.disabled");
    });

    cy.get('[data-test="room-history-reload-button"]').should(
      "not.be.disabled",
    );

    cy.fixture("roomHistory.json").then((roomHistory) => {
      roomHistory.data = roomHistory.data.slice(0, 1);
      roomHistory.meta.last_page = 5;
      roomHistory.meta.per_page = 1;
      roomHistory.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
        statusCode: 200,
        body: roomHistory,
      }).as("roomHistoryRequest");
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]')
      .should("include.text", "app.reload")
      .click();
    cy.wait("@roomHistoryRequest");

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that history is displayed correctly
    cy.get('[data-test="room-history-item"]').should("have.length", 1);
    cy.get('[data-test="room-history-item"]')
      .eq(0)
      .should("include.text", "06/22/2021, 13:05");

    // Check that reload button does not exist
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Switch to next page with general error
    cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomHistoryRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait("@roomHistoryRequest");

    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that components are not disabled
    cy.get('[data-test="sorting-type-inputgroup"]').within(() => {
      cy.get('[data-test="sorting-type-dropdown"]').within(() => {
        cy.get(".p-select-label").should(
          "not.have.attr",
          "aria-disabled",
          "true",
        );
      });

      cy.get("button").should("not.be.disabled");
    });

    cy.get('[data-test="room-history-reload-button"]').should(
      "not.be.disabled",
    );

    cy.fixture("roomHistory.json").then((roomHistory) => {
      roomHistory.data = roomHistory.data.slice(0, 1);
      roomHistory.meta.last_page = 5;
      roomHistory.meta.per_page = 1;
      roomHistory.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
        statusCode: 200,
        body: roomHistory,
      }).as("roomHistoryRequest");
    });

    // Check if reload button exists and click it
    cy.get('[data-test="loading-retry-button"]')
      .should("include.text", "app.reload")
      .click();
    cy.wait("@roomHistoryRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });

    // Check that overlay is hidden
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that history is displayed correctly
    cy.get('[data-test="room-history-item"]').should("have.length", 1);
    cy.get('[data-test="room-history-item"]')
      .eq(0)
      .should("include.text", "06/22/2021, 13:05");

    // Check that reload button does not exist
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page with 401 error
    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // 401 error room that has no access code
    cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
      statusCode: 401,
    }).as("roomHistoryRequest");

    cy.interceptRoomFilesRequest();
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomHistoryRequest");

    // Check that room gets reloaded
    cy.wait("@roomRequest");

    // Check that file tab is shown
    cy.wait("@roomFilesRequest");
    cy.url().should("not.include", "#tab=history");
    cy.url().should("include", "/rooms/abc-def-123#tab=files");

    // Check that error message is shown
    cy.checkToastMessage("app.flash.unauthenticated");
    cy.contains("auth.login").should("be.visible");

    // Reload with logged in user and history
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");

    cy.fixture("roomHistory.json").then((roomHistory) => {
      roomHistory.data = roomHistory.data.slice(0, 1);
      roomHistory.meta.last_page = 3;
      roomHistory.meta.per_page = 1;
      roomHistory.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
        statusCode: 200,
        body: roomHistory,
      }).as("roomHistoryRequest");
    });

    cy.reload();
    cy.wait("@roomRequest");
    cy.get("#tab-history").click();

    // 401 error but room has an access code
    // Switch to next page with 401 error
    cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
      statusCode: 401,
    }).as("roomHistoryRequest");

    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomHistoryRequest");

    // Check that room gets reloaded
    cy.wait("@roomRequest");

    // Check that access code overlay is shown
    cy.get('[data-test="room-access-code-overlay"]').should("be.visible");

    // Check that error message is shown
    cy.checkToastMessage("app.flash.unauthenticated");
    cy.contains("auth.login").should("be.visible");

    // 401 error but guests are forbidden
    // Reload with logged in user and history
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");
    cy.fixture("roomHistory.json").then((roomHistory) => {
      roomHistory.data = roomHistory.data.slice(0, 1);
      roomHistory.meta.last_page = 3;
      roomHistory.meta.per_page = 1;
      roomHistory.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
        statusCode: 200,
        body: roomHistory,
      }).as("roomHistoryRequest");
    });

    cy.reload();
    cy.wait("@roomRequest");
    cy.get("#tab-history").click();

    // Switch to next page with 401 error
    cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
      statusCode: 401,
    }).as("roomHistoryRequest");

    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      statusCode: 403,
      body: {
        message: "guests_not_allowed",
      },
    }).as("roomRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomHistoryRequest");

    // Check that room gets reloaded
    cy.wait("@roomRequest");

    // Check that the error message is shown
    cy.contains("rooms.only_used_by_authenticated_users").should("be.visible");
    cy.checkToastMessage("app.flash.unauthenticated");
    cy.contains("auth.login").should("be.visible");

    // Reload with logged in user and history
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");
    cy.fixture("roomHistory.json").then((roomHistory) => {
      roomHistory.data = roomHistory.data.slice(0, 1);
      roomHistory.meta.last_page = 3;
      roomHistory.meta.per_page = 1;
      roomHistory.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
        statusCode: 200,
        body: roomHistory,
      }).as("roomHistoryRequest");
    });

    cy.reload();
    cy.wait("@roomRequest");
    cy.get("#tab-history").click();

    // respond with 403 error
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.is_member = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // 403 error
    cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
      statusCode: 403,
      body: {
        message: "This action is unauthorized.",
      },
    }).as("roomHistoryRequest");

    cy.get('[data-test="paginator-next-button"]').eq(1).click();
    cy.wait("@roomHistoryRequest");

    // Check that room gets reloaded
    cy.wait("@roomRequest");
    cy.wait("@roomHistoryRequest");

    // Check that file tab is shown
    cy.wait("@roomFilesRequest");

    cy.url().should("not.include", "#tab=history");
    cy.url().should("include", "/rooms/abc-def-123#tab=files");

    // Check that error message is shown
    cy.checkToastMessage("app.flash.unauthorized");

    // Check auth errors when loading history
    cy.checkRoomAuthErrorsLoadingTab(
      "GET",
      "api/v1/rooms/abc-def-123/meetings*",
      "history",
    );
  });

  it("load history page out of range", function () {
    cy.fixture("roomHistory.json").then((roomHistory) => {
      roomHistory.data = roomHistory.data.slice(0, 1);
      roomHistory.data[0].role = 3;
      roomHistory.meta.last_page = 2;
      roomHistory.meta.per_page = 1;
      roomHistory.meta.to = 1;
      roomHistory.meta.total = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
        statusCode: 200,
        body: roomHistory,
      }).as("roomHistoryRequest");
    });

    cy.visit("/rooms/abc-def-123#tab=history");
    cy.wait("@roomRequest");
    cy.wait("@roomHistoryRequest");

    // Switch to next page but respond with no meetings on the second page
    cy.fixture("roomHistory.json").then((roomHistory) => {
      roomHistory.data = [];
      roomHistory.meta.current_page = 2;
      roomHistory.meta.from = null;
      roomHistory.meta.per_page = 2;
      roomHistory.meta.to = null;
      roomHistory.meta.total = 2;
      roomHistory.meta.total_no_filter = 2;

      const emptyRoomHistoryRequest = interceptIndefinitely(
        "GET",
        "api/v1/rooms/abc-def-123/meetings*",
        {
          statusCode: 200,
          body: roomHistory,
        },
        "roomHistoryRequest",
      );

      cy.get('[data-test="paginator-next-button"]').eq(1).click();

      cy.fixture("roomHistory.json").then((roomHistory) => {
        roomHistory.data = roomHistory.data.slice(0, 2);
        roomHistory.meta.per_page = 2;
        roomHistory.meta.to = 2;
        roomHistory.meta.total = 2;
        roomHistory.meta.total_no_filter = 2;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
          statusCode: 200,
          body: roomHistory,
        })
          .as("roomHistoryRequest")
          .then(() => {
            emptyRoomHistoryRequest.sendResponse();
          });
      });
    });

    // Wait for first room history request and check that page is still the same
    cy.wait("@roomHistoryRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "2",
      });
    });

    // Wait for second room history request and check that page is reset
    cy.wait("@roomHistoryRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        page: "1",
      });
    });
  });

  it("load history retention period", function () {
    cy.fixture("config.json").then((config) => {
      config.data.recording.meeting_usage_retention_period = 30;
      config.data.recording.attendance_retention_period = 30;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.visit("/rooms/abc-def-123#tab=history");

    cy.get('[data-test="retention-period-message"]')
      .should("include.text", "meetings.retention_period")
      .should("include.text", 'meetings.stats.retention_period_{"days":30}')
      .should(
        "include.text",
        'meetings.attendance.retention_period_{"days":30}',
      );

    cy.fixture("config.json").then((config) => {
      config.data.recording.meeting_usage_enabled = false;
      config.data.recording.meeting_usage_retention_period = 30;
      config.data.recording.attendance_retention_period = 30;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.reload();

    cy.get('[data-test="retention-period-message"]')
      .should("include.text", "meetings.retention_period")
      .should("not.include.text", 'meetings.stats.retention_period_{"days":30}')
      .should("not.include.text", "meetings.stats.retention_period")
      .should(
        "include.text",
        'meetings.attendance.retention_period_{"days":30}',
      );
  });

  it("sort history", function () {
    cy.visit("/rooms/abc-def-123#tab=history");

    cy.wait("@roomRequest");

    cy.wait("@roomHistoryRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "start",
        sort_direction: "desc",
        page: "1",
      });
    });

    cy.get('[data-test="sorting-type-dropdown-items"]').should("not.exist");

    // Check that correct sorting type is displayed
    cy.get('[data-test="sorting-type-dropdown"]')
      .should("have.text", "meetings.start")
      .click();

    cy.get('[data-test="sorting-type-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get("[data-test=sorting-type-dropdown-option]").should(
          "have.length",
          1,
        );

        cy.get("[data-test=sorting-type-dropdown-option]")
          .eq(0)
          .should("have.text", "meetings.start")
          .should("have.attr", "aria-selected", "true");

        // Click on sorting type and respond with 5 meetings on 5 differnt pages
        cy.fixture("roomHistory.json").then((roomHistory) => {
          roomHistory.data = roomHistory.data.slice(0, 1);
          roomHistory.meta.last_page = 5;
          roomHistory.meta.per_page = 1;
          roomHistory.meta.to = 1;

          cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
            statusCode: 200,
            body: roomHistory,
          }).as("roomHistoryRequest");
        });

        cy.get("[data-test=sorting-type-dropdown-option]").eq(0).click();
      });

    cy.wait("@roomHistoryRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "start",
        sort_direction: "desc",
        page: "1",
      });
    });

    cy.get("[data-test=sorting-type-dropdown-items]").should("not.exist");

    cy.get("[data-test=sorting-type-dropdown]").should(
      "have.text",
      "meetings.start",
    );

    // Check that correct meeting is displayed
    cy.get('[data-test="room-history-item"]').should("have.length", 1);
    cy.get('[data-test="room-history-item"]')
      .eq(0)
      .should("include.text", "06/22/2021, 13:05");

    // Check that pagination shows the correct number of pages
    cy.get('[data-test="paginator-page"]').should("have.length", 5);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.fixture("roomHistory.json").then((roomHistory) => {
      roomHistory.data = roomHistory.data.slice(1, 2);
      roomHistory.meta.current_page = 2;
      roomHistory.meta.from = 2;
      roomHistory.meta.last_page = 3;
      roomHistory.meta.per_page = 1;
      roomHistory.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
        statusCode: 200,
        body: roomHistory,
      }).as("roomHistoryRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomHistoryRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "start",
        sort_direction: "desc",
        page: "2",
      });
    });

    cy.get("[data-test=sorting-type-dropdown]").should(
      "have.text",
      "meetings.start",
    );

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check that correct meeting is shown
    cy.get('[data-test="room-history-item"]').should("have.length", 1);
    cy.get('[data-test="room-history-item"]')
      .eq(0)
      .should("include.text", "06/23/2021, 12:04");

    // Change sorting direction and make sure that the page is reset
    cy.fixture("roomHistory.json").then((roomHistory) => {
      roomHistory.data = roomHistory.data.slice(0, 1);
      roomHistory.meta.last_page = 3;
      roomHistory.meta.per_page = 1;
      roomHistory.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
        statusCode: 200,
        body: roomHistory,
      }).as("roomHistoryRequest");
    });

    cy.get('[data-test="sorting-type-inputgroup"]').find("button").click();

    cy.wait("@roomHistoryRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "start",
        sort_direction: "asc",
        page: "1",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Switch to next page
    cy.fixture("roomHistory.json").then((roomHistory) => {
      roomHistory.data = roomHistory.data.slice(1, 2);
      roomHistory.meta.current_page = 2;
      roomHistory.meta.from = 2;
      roomHistory.meta.last_page = 3;
      roomHistory.meta.per_page = 1;
      roomHistory.meta.to = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
        statusCode: 200,
        body: roomHistory,
      }).as("roomHistoryRequest");
    });

    // Click on button for next page (eq(1) needed because there are two paginator components
    // (first one for small devices second one for larger devices))
    cy.get('[data-test="paginator-next-button"]').eq(1).click();

    cy.wait("@roomHistoryRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "start",
        sort_direction: "asc",
        page: "2",
      });
    });

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Click on sorting type again and make sure that the page is reset
    cy.fixture("roomHistory.json").then((roomHistory) => {
      roomHistory.data = roomHistory.data.slice(0, 1);
      roomHistory.meta.last_page = 3;
      roomHistory.meta.per_page = 1;
      roomHistory.meta.to = 1;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/meetings*", {
        statusCode: 200,
        body: roomHistory,
      }).as("roomHistoryRequest");
    });

    cy.get("[data-test=sorting-type-dropdown]").click();
    cy.get("[data-test=sorting-type-dropdown-option]").eq(0).click();

    // Check that history is loaded with the page reset to the first page
    cy.wait("@roomHistoryRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        sort_by: "start",
        sort_direction: "asc",
        page: "1",
      });
    });

    cy.get("[data-test=sorting-type-dropdown]").should(
      "have.text",
      "meetings.start",
    );

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");
  });
});
