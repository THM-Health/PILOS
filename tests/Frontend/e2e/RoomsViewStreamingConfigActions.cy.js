import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";
import { parseFormData } from "../support/utils/formData.js";
import { _arrayBufferToBase64 } from "../support/utils/fileHelper.js";

describe("Rooms view streaming config actions", function () {
  beforeEach(function () {
    cy.init();
    cy.fixture("config.json").then((config) => {
      config.data.general.hide_disabled_features = true;
      config.data.streaming.enabled = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });
    cy.fixture("room.json").then((room) => {
      room.data.type.features.streaming.enabled = true;
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.fixture("roomStreamingStatus.json").then((data) => {
      cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
        statusCode: 200,
        body: data,
      }).as("roomStreamingStatus");
    });

    cy.fixture("roomStreamingConfig.json").then((data) => {
      cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/config", {
        statusCode: 200,
        body: data,
      }).as("roomStreamingConfig");
    });
  });

  it("load and show settings", function () {
    cy.visit("/rooms/abc-def-123");
    cy.get("#tab-streaming").click();

    cy.get('[data-test="streaming-config-button"]').should("be.visible");
    cy.get('[data-test="streaming-config-button"]').click();

    cy.get('[data-test="room-streaming-config-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check enabled checkbox
        cy.get("#streaming-enabled").should("not.be.checked");

        // Check streaming URL
        cy.get("#streaming-url").should("have.value", "");

        // Check pause image
        cy.get('[data-test="streaming-pause-image-field"]').within(() => {
          // Check no previews are shown
          cy.get('[data-test="streaming-pause-image-preview"]').should(
            "not.exist",
          );
          cy.get(
            '[data-test="streaming-pause-image-room-type-preview"]',
          ).should("not.exist");
          cy.get('[data-test="streaming-pause-image-system-preview"]').should(
            "not.exist",
          );

          // Check file upload buttons
          cy.get('[data-test="file-input-button"]').should(
            "have.text",
            "app.browse",
          );
          cy.get('[data-test="settings-file-delete-button"]').should(
            "not.exist",
          );
        });

        // Close dialog
        cy.get('[data-test="dialog-cancel-button"]').click();
      });

    // Open dialog with enabled, url and pause image
    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/config", {
      statusCode: 200,
      body: {
        data: {
          enabled: true,
          url: "rtmps://streaming.example.com/stream/bbb",
          pause_image: Cypress.config("baseUrl") + "/pause_image.jpg",
          room_type_default_pause_image:
            Cypress.config("baseUrl") + "/room_type_pause_image.jpg",
          system_default_pause_image:
            Cypress.config("baseUrl") + "/system_pause_image.jpg",
        },
      },
    }).as("roomStreamingConfig");
    cy.get('[data-test="streaming-config-button"]').click();

    cy.get('[data-test="room-streaming-config-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check enabled checkbox
        cy.get("#streaming-enabled").should("be.checked");

        // Check streaming URL
        cy.get("#streaming-url").should(
          "have.value",
          "rtmps://streaming.example.com/stream/bbb",
        );

        // Check pause image
        cy.get('[data-test="streaming-pause-image-field"]').within(() => {
          // Check preview is shown
          cy.get('[data-test="streaming-pause-image-preview"]')
            .should("exist")
            .should(
              "have.attr",
              "src",
              Cypress.config("baseUrl") + "/pause_image.jpg",
            );
          cy.get(
            '[data-test="streaming-pause-image-room-type-preview"]',
          ).should("not.exist");
          cy.get('[data-test="streaming-pause-image-system-preview"]').should(
            "not.exist",
          );

          // Check file upload buttons
          cy.get('[data-test="file-input-button"]').should(
            "have.text",
            "app.browse",
          );
          cy.get('[data-test="settings-file-delete-button"]').should("exist");
        });

        // Close dialog
        cy.get('[data-test="dialog-cancel-button"]').click();
      });

    // Open dialog with room type default pause image
    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/config", {
      statusCode: 200,
      body: {
        data: {
          enabled: false,
          url: null,
          pause_image: null,
          room_type_default_pause_image:
            Cypress.config("baseUrl") + "/room_type_pause_image.jpg",
          system_default_pause_image:
            Cypress.config("baseUrl") + "/system_pause_image.jpg",
        },
      },
    }).as("roomStreamingConfig");
    cy.get('[data-test="streaming-config-button"]').click();
    cy.get('[data-test="room-streaming-config-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check pause image
        cy.get('[data-test="streaming-pause-image-field"]').within(() => {
          // Check preview is shown
          cy.get('[data-test="streaming-pause-image-preview"]').should(
            "not.exist",
          );
          cy.get('[data-test="streaming-pause-image-room-type-preview"]')
            .should("exist")
            .should(
              "have.attr",
              "src",
              Cypress.config("baseUrl") + "/room_type_pause_image.jpg",
            );
          cy.get('[data-test="streaming-pause-image-system-preview"]').should(
            "not.exist",
          );
        });

        // Close dialog
        cy.get('[data-test="dialog-cancel-button"]').click();
      });

    // Open dialog with system default pause image
    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/config", {
      statusCode: 200,
      body: {
        data: {
          enabled: false,
          url: null,
          pause_image: null,
          room_type_default_pause_image: null,
          system_default_pause_image:
            Cypress.config("baseUrl") + "/system_pause_image.jpg",
        },
      },
    }).as("roomStreamingConfig");
    cy.get('[data-test="streaming-config-button"]').click();
    cy.get('[data-test="room-streaming-config-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check pause image
        cy.get('[data-test="streaming-pause-image-field"]').within(() => {
          // Check preview is shown
          cy.get('[data-test="streaming-pause-image-preview"]').should(
            "not.exist",
          );
          cy.get(
            '[data-test="streaming-pause-image-room-type-preview"]',
          ).should("not.exist");
          cy.get('[data-test="streaming-pause-image-system-preview"]')
            .should("exist")
            .should(
              "have.attr",
              "src",
              Cypress.config("baseUrl") + "/system_pause_image.jpg",
            );
        });

        // Close dialog
        cy.get('[data-test="dialog-cancel-button"]').click();
      });
  });

  it("edit settings", function () {
    cy.visit("/rooms/abc-def-123");
    cy.get("#tab-streaming").click();

    cy.get('[data-test="streaming-config-button"]').should("be.visible");
    cy.get('[data-test="streaming-config-button"]').click();

    cy.get('[data-test="room-streaming-config-dialog"]')
      .should("be.visible")
      .within(() => {
        // Enable streaming
        cy.get("#streaming-enabled").should("not.be.checked").check();

        // Enter streaming URL
        cy.get("#streaming-url")
          .should("have.value", "")
          .type("rtmps://streaming.example.com/stream/bbb");

        // Upload pause image
        cy.get('[data-test="streaming-pause-image-field"]')
          .should("be.visible")
          .within(() => {
            cy.checkSettingsFileSelector("", "pause.jpg", true);
          });

        cy.fixture("roomStreamingConfig.json").then((settings) => {
          const saveConfigRequest = interceptIndefinitely(
            "POST",
            "api/v1/rooms/abc-def-123/streaming/config",
            {
              statusCode: 200,
              body: settings,
            },
            "saveConfigRequest",
          );

          cy.get('[data-test="dialog-save-button"]')
            .should("include.text", "app.save")
            .click();

          // Check loading
          cy.get('[data-test="dialog-cancel-button"]').should("be.disabled");
          cy.get("#streaming-enabled").should("be.disabled");
          cy.get("#streaming-url").should("be.disabled");
          cy.get('[data-test="streaming-pause-image-field"]').within(() => {
            cy.get('[data-test="file-input-input"]').should("be.disabled");
            cy.get('[data-test="settings-file-cancel-button"]').should(
              "be.disabled",
            );
          });

          cy.get('[data-test="dialog-save-button"]')
            .should("be.disabled")
            .then(() => {
              saveConfigRequest.sendResponse();
            });
        });

        cy.wait("@saveConfigRequest").then((interception) => {
          const formData = parseFormData(
            interception.request.body,
            interception.request.headers,
          );

          const uploadedPauseImage = formData.get("pause_image");
          expect(uploadedPauseImage.name).to.eql("pause.jpg");
          expect(uploadedPauseImage.type).to.eql("image/jpeg");
          cy.fixture("files/pause.jpg", "base64").then((content) => {
            uploadedPauseImage.arrayBuffer().then((arrayBuffer) => {
              const base64 = _arrayBufferToBase64(arrayBuffer);
              expect(content).to.eql(base64);
            });
          });

          expect(formData.get("enabled")).to.eql("1");

          expect(formData.get("url")).to.eql(
            "rtmps://streaming.example.com/stream/bbb",
          );
        });
      });

    // Check dialog closed
    cy.get('[data-test="room-streaming-config-dialog"]').should("not.exist");

    // Save again without changes
    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/config", {
      statusCode: 200,
      body: {
        data: {
          enabled: true,
          url: "rtmps://streaming.example.com/stream/bbb",
          pause_image: Cypress.config("baseUrl") + "/pause_image.jpg",
          room_type_default_pause_image: null,
          system_default_pause_image: null,
        },
      },
    }).as("roomStreamingConfig");
    cy.get('[data-test="streaming-config-button"]').click();

    cy.get('[data-test="room-streaming-config-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.fixture("roomStreamingConfig.json").then((settings) => {
          cy.intercept("POST", "api/v1/rooms/abc-def-123/streaming/config", {
            statusCode: 200,
            body: settings,
          }).as("saveConfigRequest");

          cy.get('[data-test="dialog-save-button"]')
            .should("include.text", "app.save")
            .click();
        });

        cy.wait("@saveConfigRequest").then((interception) => {
          const formData = parseFormData(
            interception.request.body,
            interception.request.headers,
          );

          expect(formData.has("pause_image")).to.eql(false);

          expect(formData.get("enabled")).to.eql("1");

          expect(formData.get("url")).to.eql(
            "rtmps://streaming.example.com/stream/bbb",
          );
        });
      });

    // Check dialog closed
    cy.get('[data-test="room-streaming-config-dialog"]').should("not.exist");

    // Edit settings again, deleting everything
    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/config", {
      statusCode: 200,
      body: {
        data: {
          enabled: true,
          url: "rtmps://streaming.example.com/stream/bbb",
          pause_image: Cypress.config("baseUrl") + "/pause_image.jpg",
          room_type_default_pause_image: null,
          system_default_pause_image: null,
        },
      },
    }).as("roomStreamingConfig");
    cy.get('[data-test="streaming-config-button"]').click();

    cy.get('[data-test="room-streaming-config-dialog"]')
      .should("be.visible")
      .within(() => {
        // Disable streaming
        cy.get("#streaming-enabled").should("be.checked").uncheck();

        // Remove streaming URL
        cy.get("#streaming-url")
          .should("have.value", "rtmps://streaming.example.com/stream/bbb")
          .clear();

        // Remove pause image
        cy.get('[data-test="streaming-pause-image-field"]').within(() => {
          cy.get('[data-test="settings-file-delete-button"]').should("exist");
          cy.get('[data-test="settings-file-delete-button"]').click();
        });

        cy.fixture("roomStreamingConfig.json").then((settings) => {
          const saveConfigRequest = interceptIndefinitely(
            "POST",
            "api/v1/rooms/abc-def-123/streaming/config",
            {
              statusCode: 200,
              body: settings,
            },
            "saveConfigRequest",
          );

          cy.get('[data-test="dialog-save-button"]')
            .should("include.text", "app.save")
            .click();

          // Check loading
          cy.get('[data-test="dialog-cancel-button"]').should("be.disabled");
          cy.get("#streaming-enabled").should("be.disabled");
          cy.get("#streaming-url").should("be.disabled");
          cy.get('[data-test="streaming-pause-image-field"]').within(() => {
            cy.get('[data-test="settings-file-undo-delete-button"]').should(
              "be.disabled",
            );
          });

          cy.get('[data-test="dialog-save-button"]')
            .should("be.disabled")
            .then(() => {
              saveConfigRequest.sendResponse();
            });
        });

        cy.wait("@saveConfigRequest").then((interception) => {
          const formData = parseFormData(
            interception.request.body,
            interception.request.headers,
          );

          expect(formData.has("pause_image")).to.eql(true);
          expect(formData.get("pause_image")).to.eql("");

          expect(formData.get("enabled")).to.eql("0");

          expect(formData.get("url")).to.eql("");
        });
      });

    // Check dialog closed
    cy.get('[data-test="room-streaming-config-dialog"]').should("not.exist");
  });
});
