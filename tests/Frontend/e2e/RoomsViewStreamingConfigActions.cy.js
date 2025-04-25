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

    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
      fixture: "roomStreamingStatus.json",
    }).as("roomStreamingStatus");

    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/config", {
      fixture: "roomStreamingConfig.json",
    }).as("roomStreamingConfig");
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

  it("load with error", function () {
    cy.visit("/rooms/abc-def-123");
    cy.get("#tab-streaming").click();

    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/config", {
      statusCode: 500,
      body: {
        message: "Internal server error",
      },
    }).as("roomStreamingConfig");

    cy.get('[data-test="streaming-config-button"]').should("be.visible");
    cy.get('[data-test="streaming-config-button"]').click();

    cy.get('[data-test="room-streaming-config-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check input fields are disabled
        cy.get("#streaming-enabled").should("be.disabled");
        cy.get("#streaming-url").should("be.disabled");
        cy.get('[data-test="streaming-pause-image-field"]').within(() => {
          cy.get('[data-test="file-input-input"]').should("be.disabled");
        });

        // Check save buttons is disabled
        cy.get('[data-test="dialog-save-button"]').should("be.disabled");

        // Check overlay is shown
        cy.get('[data-test="overlay"]').should("is.visible");
      });

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Internal server error"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Valid response
    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/config", {
      fixture: "roomStreamingConfig.json",
    }).as("roomStreamingConfig");

    cy.get('[data-test="room-streaming-config-dialog"]')
      .should("be.visible")
      .within(() => {
        // Try again
        cy.get('[data-test="loading-retry-button"]').click();

        // Check all input fields are enabled
        cy.get("#streaming-enabled").should("not.be.disabled");
        cy.get("#streaming-url").should("not.be.disabled");
        cy.get('[data-test="streaming-pause-image-field"]').within(() => {
          cy.get('[data-test="file-input-input"]').should("not.be.disabled");
        });
        // Check save buttons is enabled
        cy.get('[data-test="dialog-save-button"]').should("not.be.disabled");

        // Check overlay is hidden
        cy.get('[data-test="overlay"]').should("not.exist");

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
        cy.intercept("POST", "api/v1/rooms/abc-def-123/streaming/config", {
          fixture: "roomStreamingConfig.json",
        }).as("saveConfigRequest");

        cy.get('[data-test="dialog-save-button"]')
          .should("include.text", "app.save")
          .click();

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

  it("edit settings errors", function () {
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
          .type("http://streaming.example.com/stream/bbb");

        // Upload pause image
        cy.get('[data-test="streaming-pause-image-field"]')
          .should("be.visible")
          .within(() => {
            cy.checkSettingsFileSelector("", "pause.jpg", true);
          });

        cy.intercept("POST", "api/v1/rooms/abc-def-123/streaming/config", {
          statusCode: 422,
          body: {
            message:
              "The RTMP(S) URL must be a RTMP or RTMPS URL. (and 2 more errors)",
            errors: {
              url: ["The RTMP(S) URL must be a RTMP or RTMPS URL."],
              pause_image: [
                "The Pause image must not be greater than 5000 kilobytes.",
                "The Pause image must have a resolution of 1920x1080 pixels.",
              ],
            },
          },
        }).as("saveConfigRequest");

        cy.get('[data-test="dialog-save-button"]')
          .should("include.text", "app.save")
          .click();
      });

    // Check dialog not closed
    cy.wait("@saveConfigRequest");
    cy.get('[data-test="room-streaming-config-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="streaming-url-field"]').should(
          "include.text",
          "The RTMP(S) URL must be a RTMP or RTMPS URL.",
        );

        cy.get('[data-test="streaming-pause-image-field"]')
          .should(
            "include.text",
            "The Pause image must not be greater than 5000 kilobytes.",
          )
          .should(
            "include.text",
            "The Pause image must have a resolution of 1920x1080 pixels.",
          );
      });

    // Save again, general error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/streaming/config", {
      statusCode: 500,
      body: {
        message: "Internal server error",
      },
    }).as("saveConfigRequest");
    cy.get('[data-test="room-streaming-config-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="dialog-save-button"]')
          .should("include.text", "app.save")
          .click();
      });

    cy.wait("@saveConfigRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Internal server error"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check dialog not closed
    cy.get('[data-test="room-streaming-config-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check that error messages are removed
        cy.get('[data-test="streaming-url-field"]').should(
          "not.include.text",
          "The RTMP(S) URL must be a RTMP or RTMPS URL.",
        );
        cy.get('[data-test="streaming-pause-image-field"]').should(
          "not.include.text",
          "The Pause image must not be greater than 5000 kilobytes.",
        );

        // Close dialog
        cy.get('[data-test="dialog-cancel-button"]').click();
      });
  });

  it("view/edit settings with different permissions", function () {
    // Check as co-owner
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.is_member = true;
      room.data.is_co_owner = true;

      room.data.type.features.streaming.enabled = true;
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");
    cy.get("#tab-streaming").click();

    cy.get('[data-test="streaming-config-button"]').should("be.visible");
    cy.get('[data-test="streaming-config-button"]').click();

    cy.get('[data-test="room-streaming-config-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check input fields are enabled
        cy.get("#streaming-enabled").should("not.be.disabled");
        cy.get("#streaming-url").should("not.be.disabled");
        cy.get('[data-test="streaming-pause-image-field"]').within(() => {
          cy.get('[data-test="file-input-input"]').should("not.be.disabled");
        });

        // Check save buttons exists
        cy.get('[data-test="dialog-save-button"]').should("exist");

        // Close dialog
        cy.get('[data-test="dialog-cancel-button"]').click();
      });

    // Check with rooms.viewAll permission
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["rooms.viewAll"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.current_user.permissions = ["rooms.viewAll"];

      room.data.type.features.streaming.enabled = true;
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });
    cy.visit("/rooms/abc-def-123");
    cy.get("#tab-streaming").click();

    cy.get('[data-test="streaming-config-button"]').should("be.visible");
    cy.get('[data-test="streaming-config-button"]').click();

    cy.get('[data-test="room-streaming-config-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check input fields are disabled
        cy.get("#streaming-enabled").should("be.disabled");
        cy.get("#streaming-url").should("be.disabled");
        cy.get('[data-test="streaming-pause-image-field"]').within(() => {
          cy.get('[data-test="file-input-input"]').should("be.disabled");
        });

        // Check save buttons is missing
        cy.get('[data-test="dialog-save-button"]').should("not.exist");

        // Close dialog
        cy.get('[data-test="dialog-cancel-button"]').click();
      });

    // Check with rooms.manage permission
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "rooms.create",
        "rooms.viewAll",
        "rooms.manage",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.current_user.permissions = [
        "rooms.create",
        "rooms.viewAll",
        "rooms.manage",
      ];

      room.data.type.features.streaming.enabled = true;
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });
    cy.visit("/rooms/abc-def-123");
    cy.get("#tab-streaming").click();

    cy.get('[data-test="streaming-config-button"]').should("be.visible");
    cy.get('[data-test="streaming-config-button"]').click();

    cy.get('[data-test="room-streaming-config-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check input fields are enabled
        cy.get("#streaming-enabled").should("not.be.disabled");
        cy.get("#streaming-url").should("not.be.disabled");
        cy.get('[data-test="streaming-pause-image-field"]').within(() => {
          cy.get('[data-test="file-input-input"]').should("not.be.disabled");
        });

        // Check save buttons exists
        cy.get('[data-test="dialog-save-button"]').should("exist");

        // Close dialog
        cy.get('[data-test="dialog-cancel-button"]').click();
      });
  });
});
