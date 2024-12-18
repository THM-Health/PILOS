import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";
describe("Rooms view history meeting actions", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomHistoryRequests();
  });

  it("show stats", function () {
    cy.visit("/rooms/abc-def-123#tab=history");

    cy.wait("@roomRequest");
    cy.wait("@roomHistoryRequest");

    const statsRequest = interceptIndefinitely(
      "GET",
      "api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/stats",
      { fixture: "roomHistoryStats.json" },
      "statsRequest",
    );

    cy.get('[data-test="room-history-statistic-dialog"]').should("not.exist");
    cy.get('[data-test="room-history-item"]')
      .eq(4)
      .find('[data-test="room-history-statistic-button"]')
      .click();

    cy.get('[data-test="room-history-statistic-dialog"]')
      .should("be.visible")
      .should(
        "include.text",
        'meetings.stats.modal_title_{"room":"Meeting One"}',
      )
      .and("include.text", "06/18/2021, 09:12")
      .and("include.text", "meetings.stats.no_breakout_support")
      .within(() => {
        // Check loading
        cy.get('[data-test="overlay"]')
          .should("be.visible")
          .then(() => {
            statsRequest.sendResponse();
          });

        cy.wait("@statsRequest");

        // Check that overlay is hidden
        cy.get('[data-test="overlay"]').should("not.exist");

        // Check that overlay is hidden
        cy.get('[data-test="overlay"]').should("not.exist");

        // Check that chart is displayed
        cy.get('[data-test="chart"] > canvas')
          .should("be.visible")
          .should("have.attr", "style")
          .and("include", "display: block");

        cy.get('[data-test="chart"] > canvas').should(
          "have.attr",
          "width",
          1163,
        );

        cy.get('[data-test="chart"] > canvas').then(($canvas) => {
          cy.fixture("files/statsGraph.png", "base64").then((image) => {
            expect($canvas[0].toDataURL()).to.equal(
              "data:image/png;base64," + image,
            );
          });
        });
      });
  });

  it("show stats errors", function () {
    cy.visit("/rooms/abc-def-123#tab=history");

    cy.wait("@roomRequest");
    cy.wait("@roomHistoryRequest");

    cy.intercept(
      "GET",
      "api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/stats",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
    ).as("statsRequest");

    cy.get('[data-test="room-history-statistic-dialog"]').should("not.exist");

    cy.get('[data-test="room-history-item"]')
      .eq(4)
      .find('[data-test="room-history-statistic-button"]')
      .click();

    cy.wait("@statsRequest");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Close dialog
    cy.get('[data-test="dialog-header-close-button"]').click();

    cy.get('[data-test="room-history-statistic-dialog"]').should("not.exist");

    // Check auth errors
    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-history-item"]')
          .eq(4)
          .find('[data-test="room-history-statistic-button"]')
          .click();
      },
      "GET",
      "api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/stats",
      "history",
    );
  });

  it("show attendance", function () {
    cy.visit("/rooms/abc-def-123#tab=history");

    cy.wait("@roomRequest");
    cy.wait("@roomHistoryRequest");

    const attendanceRequest = interceptIndefinitely(
      "GET",
      "api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/attendance",
      { fixture: "roomHistoryAttendance.json" },
      "attendanceRequest",
    );

    cy.get('[data-test="room-history-attendance-dialog"]').should("not.exist");
    cy.get('[data-test="room-history-item"]')
      .eq(4)
      .find('[data-test="room-history-attendance-button"]')
      .click();

    cy.get('[data-test="room-history-attendance-dialog"]')
      .should("be.visible")
      .should(
        "include.text",
        'meetings.stats.modal_title_{"room":"Meeting One"}',
      )
      .and("include.text", "06/18/2021, 09:12 - 06/18/2021, 09:15")
      .and("include.text", "meetings.stats.no_breakout_support")
      .within(() => {
        // Check loading
        cy.get('[data-test="overlay"]').should("be.visible");
        cy.get('[data-test="room-history-attendance-loading-icon"]')
          .should("be.visible")
          .then(() => {
            attendanceRequest.sendResponse();
          });

        cy.wait("@attendanceRequest");

        // Check that overlay is hidden
        cy.get('[data-test="overlay"]').should("not.exist");
        cy.get('[data-test="room-history-attendance-loading-icon"]').should(
          "not.exist",
        );

        // Check that attendance is displayed correctly
        cy.get('[data-test="room-history-attendance-item"]').should(
          "have.length",
          2,
        );

        cy.get('[data-test="room-history-attendance-item"]')
          .eq(0)
          .within(() => {
            cy.get('[data-test="room-history-attendance-item-cell"]').should(
              "have.length",
              4,
            );

            cy.get('[data-test="room-history-attendance-item-cell"]')
              .eq(0)
              .should("have.text", "John Doe");

            cy.get('[data-test="room-history-attendance-item-cell"]')
              .eq(1)
              .should("have.text", "---");

            cy.get('[data-test="room-history-attendance-item-cell"]')
              .eq(2)
              .should(
                "have.text",
                'meetings.attendance.duration_minute_{"duration":4}',
              );

            cy.get('[data-test="room-history-attendance-item-cell"]')
              .eq(3)
              .should(
                "have.text",
                '06/18/2021, 09:41 - 06/18/2021, 09:45 (meetings.attendance.duration_minute_{"duration":4})',
              );
          });

        cy.get('[data-test="room-history-attendance-item"]')
          .eq(1)
          .within(() => {
            cy.get('[data-test="room-history-attendance-item-cell"]').should(
              "have.length",
              4,
            );

            cy.get('[data-test="room-history-attendance-item-cell"]')
              .eq(0)
              .should("have.text", "Max Doe");

            cy.get('[data-test="room-history-attendance-item-cell"]')
              .eq(1)
              .should("have.text", "max.doe@domain.tld");

            cy.get('[data-test="room-history-attendance-item-cell"]')
              .eq(2)
              .should(
                "have.text",
                'meetings.attendance.duration_minute_{"duration":33}',
              );

            cy.get('[data-test="room-history-attendance-item-cell"]')
              .eq(3)
              .should(
                "have.text",
                '06/18/2021, 09:13 - 06/18/2021, 09:42 (meetings.attendance.duration_minute_{"duration":28})' +
                  '06/18/2021, 09:44 - 06/18/2021, 09:49 (meetings.attendance.duration_minute_{"duration":5})',
              );
          });

        // Check search
        cy.get('[data-test="room-history-attendance-search"]').type("Max");

        cy.get('[data-test="room-history-attendance-item"]').should(
          "have.length",
          1,
        );
        cy.get('[data-test="room-history-attendance-item"]')
          .eq(0)
          .should("include.text", "Max Doe");

        cy.get('[data-test="room-history-attendance-search"]').type("x");
        cy.get('[data-test="room-history-attendance-item"]').should(
          "have.length",
          0,
        );

        cy.contains("meetings.attendance.no_data_filtered").should(
          "be.visible",
        );

        // Clear search
        cy.get('[data-test="room-history-attendance-search"]').clear();

        cy.get('[data-test="room-history-attendance-item"]').should(
          "have.length",
          2,
        );
        cy.get('[data-test="room-history-attendance-item"]')
          .eq(0)
          .should("include.text", "John Doe");

        cy.get('[data-test="room-history-attendance-item"]')
          .eq(1)
          .should("include.text", "Max Doe");

        // Check download button
        cy.get('a[data-test="room-history-attendance-download-button"]')
          .should(
            "have.attr",
            "href",
            Cypress.config("baseUrl") +
              "/download/attendance/3a3e504a-d2c4-431c-8ca1-a62598e66761",
          )
          .should("have.attr", "target", "_blank");
      });

    // Close dialog and open again with no attendance
    cy.get('[data-test="dialog-header-close-button"]').click();

    cy.get('[data-test="room-history-attendance-dialog"]').should("not.exist");

    cy.intercept(
      "GET",
      "api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/attendance",
      {
        statusCode: 200,
        body: {
          data: [],
        },
      },
    ).as("attendanceRequest");

    cy.get('[data-test="room-history-item"]')
      .eq(4)
      .find('[data-test="room-history-attendance-button"]')
      .click();

    cy.wait("@attendanceRequest");

    cy.get('[data-test="room-history-attendance-dialog"]')
      .should("be.visible")
      .should("include.text", "meetings.attendance.no_data")
      .within(() => {
        cy.get('[data-test="room-history-attendance-item"]').should(
          "have.length",
          0,
        );
      });
  });

  it("show attendance errors", function () {
    cy.intercept(
      "GET",
      "api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/attendance",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
    ).as("attendanceRequest");

    cy.visit("/rooms/abc-def-123#tab=history");

    cy.wait("@roomRequest");
    cy.wait("@roomHistoryRequest");

    cy.get('[data-test="room-history-attendance-dialog"]').should("not.exist");
    cy.get('[data-test="room-history-item"]')
      .eq(4)
      .find('[data-test="room-history-attendance-button"]')
      .click();

    cy.wait("@attendanceRequest");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Close dialog
    cy.get('[data-test="dialog-header-close-button"]').click();

    cy.get('[data-test="room-history-attendance-dialog"]').should("not.exist");

    // Check auth errors
    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-history-item"]')
          .eq(4)
          .find('[data-test="room-history-attendance-button"]')
          .click();
      },
      "GET",
      "api/v1/meetings/3a3e504a-d2c4-431c-8ca1-a62598e66761/attendance",
      "history",
    );
  });
});
