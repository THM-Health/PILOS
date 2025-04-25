import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";
import { parseFormData } from "../support/utils/formData.js";
import { _arrayBufferToBase64 } from "../support/utils/fileHelper.js";

describe("Admin settings with edit permission", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminStreamingIndexRequests();

    cy.fixture("config.json").then((config) => {
      config.data.streaming.enabled = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "streaming.viewAny",
        "streaming.update",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("edit settings", function () {
    cy.visit("/admin/streaming_settings");

    cy.wait("@streamingRequest");

    cy.contains("admin.streaming.general.title");

    cy.get('[data-test="default-pause-image-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.default_pause_image")
      .within(() => {
        cy.checkSettingsFileSelector("", "pause.jpg", true);
      });

    cy.get('[data-test="css-file-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.css_file")
      .within(() => {
        cy.checkSettingsFileSelector("", "streaming.css", true);
      });

    cy.get('[data-test="join-parameters-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.join_parameters")
      .and("include.text", "admin.streaming.join_parameters_description")
      .within(() => {
        cy.get("#join-parameters")
          .should("have.value", "")
          .type(
            "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true",
          );
      });

    // Save changes
    cy.fixture("streaming.json").then((settings) => {
      settings.data.default_pause_image = "https://example.com/pause.jpg";
      settings.data.css_file = "https://example.com/streaming.css";
      settings.data.join_parameters =
        "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true";

      const saveStreamingRequest = interceptIndefinitely(
        "POST",
        "api/v1/streaming",
        {
          statusCode: 200,
          body: settings,
        },
        "saveStreamingRequest",
      );

      cy.get('[data-test="save-button"]')
        .should("include.text", "app.save")
        .click();

      // Check loading
      cy.get('[data-test="overlay"]').should("be.visible");
      cy.get('[data-test="save-button"]')
        .should("be.disabled")
        .then(() => {
          saveStreamingRequest.sendResponse();
        });
    });

    cy.wait("@saveStreamingRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      const uploadedPauseImage = formData.get("default_pause_image");
      expect(uploadedPauseImage.name).to.eql("pause.jpg");
      expect(uploadedPauseImage.type).to.eql("image/jpeg");
      cy.fixture("files/pause.jpg", "base64").then((content) => {
        uploadedPauseImage.arrayBuffer().then((arrayBuffer) => {
          const base64 = _arrayBufferToBase64(arrayBuffer);
          expect(content).to.eql(base64);
        });
      });

      const uploadedCSSFile = formData.get("css_file");
      expect(uploadedCSSFile.name).to.eql("streaming.css");
      expect(uploadedCSSFile.type).to.eql("text/css");

      cy.fixture("files/streaming.css", "base64").then((content) => {
        uploadedCSSFile.arrayBuffer().then((arrayBuffer) => {
          const base64 = _arrayBufferToBase64(arrayBuffer);
          expect(content).to.eql(base64);
        });
      });

      const joinParameters = formData.get("join_parameters");
      expect(joinParameters).to.eql(
        "userdata-bbb_hide_nav_bar=true\r\nuserdata-bbb_hide_notifications=true",
      );
    });

    // Check that loading is done
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="save-button"]').should("not.be.disabled");

    // Check that settings are shown correctly
    cy.get('[data-test="default-pause-image-field"]').within(() => {
      cy.get('[data-test="file-input-button"]').should(
        "have.text",
        "app.browse",
      );

      cy.get('[data-test="settings-file-delete-button"]').should("be.visible");

      cy.get('[data-test="settings-file-view-button"]')
        .should("be.visible")
        .and("include.text", "app.view")
        .and("have.attr", "href", "https://example.com/pause.jpg");
    });

    cy.get('[data-test="css-file-field"]').within(() => {
      cy.get('[data-test="file-input-button"]').should(
        "have.text",
        "app.browse",
      );

      cy.get('[data-test="settings-file-delete-button"]').should("be.visible");

      cy.get('[data-test="settings-file-view-button"]')
        .should("be.visible")
        .and("include.text", "app.view")
        .and("have.attr", "href", "https://example.com/streaming.css");
    });

    // Delete pause image and CSS file
    cy.get('[data-test="default-pause-image-field"]').within(() => {
      cy.get('[data-test="settings-file-delete-button"]').click();
    });
    cy.get('[data-test="css-file-field"]').within(() => {
      cy.get('[data-test="settings-file-delete-button"]').click();
    });

    // Save changes
    cy.fixture("streaming.json").then((settings) => {
      settings.data.default_pause_image = null;
      settings.data.css_file = null;
      settings.data.join_parameters =
        "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true";

      cy.intercept("POST", "api/v1/streaming", {
        statusCode: 200,
        body: settings,
      }).as("saveStreamingRequest");

      cy.get('[data-test="save-button"]')
        .should("include.text", "app.save")
        .click();
    });

    cy.wait("@saveStreamingRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );

      const uploadedPauseImage = formData.get("default_pause_image");
      expect(uploadedPauseImage).to.eql("");

      const uploadedCSSFile = formData.get("css_file");
      expect(uploadedCSSFile).to.eql("");
    });

    // Check input fields are empty
    cy.get('[data-test="default-pause-image-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.default_pause_image")
      .within(() => {
        cy.checkSettingsFileSelector("", "pause.jpg", true);
      });

    cy.get('[data-test="css-file-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.css_file")
      .within(() => {
        cy.checkSettingsFileSelector("", "streaming.css", true);
      });
  });

  it("edit settings saving error", function () {
    cy.visit("/admin/streaming_settings");

    cy.wait("@streamingRequest");

    cy.contains("admin.streaming.general.title");

    cy.get('[data-test="default-pause-image-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.default_pause_image")
      .within(() => {
        cy.checkSettingsFileSelector("", "pause.jpg", true);
      });

    cy.get('[data-test="css-file-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.css_file")
      .within(() => {
        cy.checkSettingsFileSelector("", "streaming.css", true);
      });

    cy.get('[data-test="join-parameters-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.join_parameters")
      .and("include.text", "admin.streaming.join_parameters_description")
      .within(() => {
        cy.get("#join-parameters")
          .should("have.value", "")
          .type("foo=bar\nuserdata-bbb_hide_notifications");
      });

    // Check 422 error (validation error)
    cy.intercept("POST", "api/v1/streaming", {
      statusCode: 422,
      body: {
        message:
          "The Default pause image must have a resolution of 1920x1080 pixels. (and 3 more errors)",
        errors: {
          default_pause_image: [
            "The Default pause image must have a resolution of 1920x1080 pixels.",
          ],
          css_file: [
            "The CSS style file field must have one of the following extensions: css.",
          ],
          join_parameters: [
            "The foo parameter does not exist.",
            "The userdata-bbb_hide_notifications parameter is missing a value.",
          ],
        },
      },
    }).as("saveStreamingRequest");

    cy.get('[data-test="save-button"]')
      .should("include.text", "app.save")
      .click();

    cy.wait("@saveStreamingRequest");

    // Check error messages
    cy.get('[data-test="default-pause-image-field"]').should(
      "include.text",
      "The Default pause image must have a resolution of 1920x1080 pixels.",
    );
    cy.get('[data-test="css-file-field"]').should(
      "include.text",
      "The CSS style file field must have one of the following extensions: css.",
    );
    cy.get('[data-test="join-parameters-field"]')
      .should("include.text", "The foo parameter does not exist.")
      .should(
        "include.text",
        "The userdata-bbb_hide_notifications parameter is missing a value.",
      );

    // Check with 500 error
    cy.intercept("POST", "api/v1/streaming", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("saveStreamingRequest");
    cy.get('[data-test="save-button"]').click();
    cy.wait("@saveStreamingRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check validation errors are removed
    cy.get('[data-test="default-pause-image-field"]').should(
      "not.include.text",
      "The Default pause image must have a resolution of 1920x1080 pixels.",
    );
    cy.get('[data-test="css-file-field"]').should(
      "not.include.text",
      "The CSS style file field must have one of the following extensions: css.",
    );
    cy.get('[data-test="join-parameters-field"]')
      .should("not.include.text", "The foo parameter does not exist.")
      .should(
        "not.include.text",
        "The userdata-bbb_hide_notifications parameter is missing a value.",
      );
  });

  it("edit settings loading error", function () {
    cy.intercept("GET", "api/v1/streaming", {
      statusCode: 500,
      body: {
        message: "Internal server error",
      },
    }).as("streamingRequest");

    cy.visit("/admin/streaming_settings");

    cy.wait("@streamingRequest");

    // Check overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check all input fields are disabled
    cy.get('[data-test="default-pause-image-field"]').within(() => {
      cy.get('[data-test="file-input-input"]').should("be.disabled");
    });
    cy.get('[data-test="css-file-field"]').within(() => {
      cy.get('[data-test="file-input-input"]').should("be.disabled");
    });
    cy.get('[data-test="join-parameters-field"]').within(() => {
      cy.get("#join-parameters").should("be.disabled");
    });

    // Check save button is disabled
    cy.get('[data-test="save-button"]').should("be.disabled");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Internal server error"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Valid response
    cy.intercept("GET", "api/v1/streaming", {
      fixture: "streaming.json",
    }).as("roomStreamingConfig");

    // Try again
    cy.get('[data-test="loading-retry-button"]').click();

    // Check overlay is gone
    cy.get('[data-test="overlay"]').should("not.exist");

    // Check all input fields are enabled
    cy.get('[data-test="default-pause-image-field"]').within(() => {
      cy.get('[data-test="file-input-input"]').should("not.be.disabled");
    });
    cy.get('[data-test="css-file-field"]').within(() => {
      cy.get('[data-test="file-input-input"]').should("not.be.disabled");
    });
    cy.get('[data-test="join-parameters-field"]').within(() => {
      cy.get("#join-parameters").should("not.be.disabled");
    });

    // Check save button is enabled
    cy.get('[data-test="save-button"]').should("not.be.disabled");
  });

  it("check settings with update permission", function () {
    cy.visit("/admin/streaming_settings");

    cy.wait("@streamingRequest");

    cy.contains("admin.streaming.general.title");

    cy.get('[data-test="default-pause-image-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.default_pause_image")
      .within(() => {
        cy.checkSettingsFileSelector("", "pause.jpg", true);
      });

    cy.get('[data-test="css-file-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.css_file")
      .within(() => {
        cy.checkSettingsFileSelector("", "streaming.css", true);
      });

    cy.get('[data-test="join-parameters-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.join_parameters")
      .and("include.text", "admin.streaming.join_parameters_description")
      .within(() => {
        cy.get("#join-parameters")
          .should("have.value", "")
          .and("not.be.disabled");
      });

    // Reload with different settings
    cy.fixture("streaming.json").then((settings) => {
      settings.data.default_pause_image = "https://example.com/image.png";
      settings.data.css_file = "https://example.com/streaming.css";
      settings.data.join_parameters =
        "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true";

      cy.intercept("GET", "api/v1/streaming", {
        statusCode: 200,
        body: settings,
      }).as("streamingRequest");
    });

    cy.reload();

    cy.wait("@streamingRequest");

    cy.get('[data-test="default-pause-image-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.default_pause_image")
      .within(() => {
        cy.checkSettingsFileSelector(
          "https://example.com/image.png",
          "pause.jpg",
          true,
        );
      });

    cy.get('[data-test="css-file-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.css_file")
      .within(() => {
        cy.checkSettingsFileSelector(
          "https://example.com/streaming.css",
          "streaming.css",
          true,
        );
      });

    cy.get('[data-test="join-parameters-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.join_parameters")
      .and("include.text", "admin.streaming.join_parameters_description")
      .within(() => {
        cy.get("#join-parameters")
          .should(
            "have.value",
            "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_hide_notifications=true",
          )
          .and("not.be.disabled");
      });
  });

  it("check room type settings table", function () {
    cy.visit("/admin/streaming_settings");

    cy.wait("@streamingRequest");

    cy.contains("admin.streaming.room_types.title");

    // Count table rows
    cy.get('[data-test="room-type-item"]').should("have.length", 2);

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    // Check columns and their content
    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-type-item-cell"]').should("have.length", 4);
        cy.get('[data-test="room-type-item-cell"]')
          .eq(0)
          .should("have.text", "Exam");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(1)
          .find(".fa-solid.fa-times")
          .should("exist");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(2)
          .find(".fa-solid.fa-times")
          .should("exist");
      });

    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="room-type-item-cell"]').should("have.length", 4);
        cy.get('[data-test="room-type-item-cell"]')
          .eq(0)
          .should("have.text", "Lecture");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(1)
          .find(".fa-solid.fa-check")
          .should("exist");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(2)
          .find(".fa-solid.fa-times")
          .should("exist");
      });

    // Navigate to the second page
    cy.get('[data-test="paginator-page"]').eq(1).click();

    // Check that correct pagination is active
    cy.get('[data-test="paginator-page"]')
      .eq(1)
      .should("have.attr", "data-p-active", "true");

    // Check columns and their content
    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-type-item-cell"]').should("have.length", 4);
        cy.get('[data-test="room-type-item-cell"]')
          .eq(0)
          .should("have.text", "Meeting");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(1)
          .find(".fa-solid.fa-times")
          .should("exist");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(2)
          .find(".fa-solid.fa-times")
          .should("exist");
      });

    // Change order by streaming enabled
    cy.get('[data-test="room-type-header-cell"]').eq(1).click();

    // Check pagination is reset to first page and items on first page have streaming disabled
    cy.get('[data-test="paginator-page"]')
      .eq(0)
      .should("have.attr", "data-p-active", "true");

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-type-item-cell"]')
          .eq(0)
          .should("have.text", "Meeting");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(1)
          .find(".fa-solid.fa-times")
          .should("exist");
      });

    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="room-type-item-cell"]')
          .eq(0)
          .should("have.text", "Exam");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(1)
          .find(".fa-solid.fa-times")
          .should("exist");
      });

    // Reload with different settings
    cy.fixture("streaming.json").then((settings) => {
      settings.data.room_types[0].streaming_settings.enabled = false;
      settings.data.room_types[0].streaming_settings.default_pause_image =
        "https://example.com/lecture-pause.jpg";

      settings.data.room_types[2].streaming_settings.enabled = true;

      cy.intercept("GET", "api/v1/streaming", {
        statusCode: 200,
        body: settings,
      }).as("streamingRequest");
    });

    cy.reload();

    cy.wait("@streamingRequest");

    // Check that the default pause image is set correctly
    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-type-item-cell"]')
          .eq(0)
          .should("have.text", "Exam");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(1)
          .find(".fa-solid.fa-check")
          .should("exist");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(2)
          .find(".fa-solid.fa-times")
          .should("exist");
      });
    cy.get('[data-test="room-type-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-test="room-type-item-cell"]')
          .eq(0)
          .should("have.text", "Lecture");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(1)
          .find(".fa-solid.fa-times")
          .should("exist");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(2)
          .find(".fa-solid.fa-check")
          .should("exist");
      });
  });

  it("edit room type settings", function () {
    cy.visit("/admin/streaming_settings");

    cy.intercept("GET", "api/v1/roomTypes/3/streaming", {
      fixture: "roomTypeStreamingSettings.json",
    }).as("roomTypeStreamingSettingsRequest");

    cy.wait("@streamingRequest");

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-type-item-cell"]').should("have.length", 4);
        cy.get('[data-test="room-type-item-cell"]')
          .eq(0)
          .should("have.text", "Exam");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(1)
          .find(".fa-solid.fa-times")
          .should("exist");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(2)
          .find(".fa-solid.fa-times")
          .should("exist");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(3)
          .find("button")
          .click();

        cy.wait("@roomTypeStreamingSettingsRequest");
      });

    cy.get('[data-test="streaming-room-type-settings-edit-dialog"]')
      .should("be.visible")
      .and(
        "include.text",
        'admin.streaming.room_types.edit_dialog.title_{"name":"Exam"}',
      )
      .within(() => {
        // Check streaming disabled and no default pause image
        // and change values
        cy.get('[data-test="streaming-enabled-field"]')
          .should("have.text", "admin.streaming.enabled")
          .within(() => {
            cy.get("#streaming-enabled").should("not.be.checked").click();
          });

        cy.get('[data-test="streaming-default-pause-image-field"]')
          .should("be.visible")
          .and("include.text", "admin.streaming.default_pause_image")
          .within(() => {
            cy.checkSettingsFileSelector("", "pause.jpg", true);
          });

        cy.fixture("roomTypeStreamingSettings.json").then((settings) => {
          const saveStreamingRequest = interceptIndefinitely(
            "POST",
            "api/v1/roomTypes/3/streaming",
            {
              statusCode: 200,
              body: settings,
            },
            "saveStreamingRequest",
          );

          cy.get('[data-test="dialog-save-button"]')
            .should("not.be.disabled")
            .click();

          // Check loading
          cy.get('[data-test="dialog-save-button"]').should("be.disabled");
          cy.get("#streaming-enabled").should("be.disabled");
          cy.get(
            '[data-test="streaming-default-pause-image-field"] input',
          ).should("be.disabled");
          cy.get('[data-test="settings-file-cancel-button"]').should(
            "be.disabled",
          );

          cy.fixture("streaming.json").then((settings) => {
            settings.data.room_types[2].streaming_settings.enabled = true;
            settings.data.room_types[2].streaming_settings.default_pause_image =
              "https://example.com/lecture-pause.jpg";

            cy.intercept("GET", "api/v1/streaming", {
              statusCode: 200,
              body: settings,
            }).as("streamingRequest");

            saveStreamingRequest.sendResponse();

            cy.wait("@saveStreamingRequest").then((interception) => {
              const formData = parseFormData(
                interception.request.body,
                interception.request.headers,
              );

              const uploadedPauseImage = formData.get("default_pause_image");
              expect(uploadedPauseImage.name).to.eql("pause.jpg");
              expect(uploadedPauseImage.type).to.eql("image/jpeg");
              cy.fixture("files/pause.jpg", "base64").then((content) => {
                uploadedPauseImage.arrayBuffer().then((arrayBuffer) => {
                  const base64 = _arrayBufferToBase64(arrayBuffer);
                  expect(content).to.eql(base64);
                });
              });

              const streamingEnabled = formData.get("enabled");
              expect(streamingEnabled).to.eq("1");
            });
          });
        });
      });

    // Table should be reloaded after successful save
    cy.wait("@streamingRequest");
    // Check if table is updated
    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-type-item-cell"]').should("have.length", 4);
        cy.get('[data-test="room-type-item-cell"]')
          .eq(0)
          .should("have.text", "Exam");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(1)
          .find(".fa-solid.fa-check")
          .should("exist");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(2)
          .find(".fa-solid.fa-check")
          .should("exist");

        // Edit again, disable streaming and remove pause image
        cy.fixture("roomTypeStreamingSettings.json").then((settings) => {
          settings.data.default_pause_image = "https://example.com/pause.jpg";
          settings.data.enabled = true;
          cy.intercept("GET", "api/v1/roomTypes/3/streaming", {
            statusCode: 200,
            body: settings,
          }).as("roomTypeStreamingSettingsRequest");
        });

        cy.get('[data-test="room-type-item-cell"]')
          .eq(3)
          .find("button")
          .click();

        cy.wait("@roomTypeStreamingSettingsRequest");
      });

    cy.get('[data-test="streaming-room-type-settings-edit-dialog"]')
      .should("be.visible")
      .and(
        "include.text",
        'admin.streaming.room_types.edit_dialog.title_{"name":"Exam"}',
      )
      .within(() => {
        // Check streaming is enabled and change to disabled
        cy.get('[data-test="streaming-enabled-field"]')
          .should("have.text", "admin.streaming.enabled")
          .within(() => {
            cy.get("#streaming-enabled").should("be.checked").click();
          });

        // Check default pause image is set and remove it
        cy.get('[data-test="streaming-default-pause-image-field"]')
          .should("be.visible")
          .and("include.text", "admin.streaming.default_pause_image")
          .within(() => {
            cy.checkSettingsFileSelector(
              "https://example.com/pause.jpg",
              "pause.jpg",
              true,
            );
          });
        cy.get('[data-test="settings-file-cancel-button"]').click();
        cy.get('[data-test="settings-file-delete-button"]').click();

        cy.fixture("roomTypeStreamingSettings.json").then((settings) => {
          const saveStreamingRequest = interceptIndefinitely(
            "POST",
            "api/v1/roomTypes/3/streaming",
            {
              statusCode: 200,
              body: settings,
            },
            "saveStreamingRequest",
          );

          cy.fixture("streaming.json").then((settings) => {
            settings.data.room_types[2].streaming_settings.enabled = false;
            settings.data.room_types[2].streaming_settings.default_pause_image =
              null;

            cy.intercept("GET", "api/v1/streaming", {
              statusCode: 200,
              body: settings,
            }).as("streamingRequest");

            saveStreamingRequest.sendResponse();

            cy.get('[data-test="dialog-save-button"]')
              .should("not.be.disabled")
              .click();

            cy.wait("@saveStreamingRequest").then((interception) => {
              const formData = parseFormData(
                interception.request.body,
                interception.request.headers,
              );

              const uploadedPauseImage = formData.get("default_pause_image");
              expect(uploadedPauseImage).to.eql("");

              const streamingEnabled = formData.get("enabled");
              expect(streamingEnabled).to.eq("0");
            });
          });
        });
      });

    // Table should be reloaded after successful save
    cy.wait("@streamingRequest");
    // Check if table is updated
    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-type-item-cell"]').should("have.length", 4);
        cy.get('[data-test="room-type-item-cell"]')
          .eq(0)
          .should("have.text", "Exam");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(1)
          .find(".fa-solid.fa-times")
          .should("exist");

        cy.get('[data-test="room-type-item-cell"]')
          .eq(2)
          .find(".fa-solid.fa-times")
          .should("exist");
      });
  });

  it("edit room type settings saving error", function () {
    cy.visit("/admin/streaming_settings");

    cy.intercept("GET", "api/v1/roomTypes/3/streaming", {
      fixture: "roomTypeStreamingSettings.json",
    }).as("roomTypeStreamingSettingsRequest");

    cy.wait("@streamingRequest");

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-type-item-cell"]')
          .eq(3)
          .find("button")
          .click();

        cy.wait("@roomTypeStreamingSettingsRequest");
      });

    cy.get('[data-test="streaming-room-type-settings-edit-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check streaming disabled and no default pause image
        // and change values
        cy.get('[data-test="streaming-enabled-field"]').within(() => {
          cy.get("#streaming-enabled").should("not.be.checked").click();
        });

        cy.get('[data-test="streaming-default-pause-image-field"]').within(
          () => {
            cy.checkSettingsFileSelector("", "pause.jpg", true);
          },
        );

        // Check 422 error (validation error)
        cy.intercept("POST", "api/v1/roomTypes/3/streaming", {
          statusCode: 422,
          body: {
            message:
              "The Default pause image must have a resolution of 1920x1080 pixels.",
            errors: {
              default_pause_image: [
                "The Default pause image must have a resolution of 1920x1080 pixels.",
              ],
            },
          },
        }).as("saveStreamingRequest");

        cy.get('[data-test="dialog-save-button"]')
          .should("not.be.disabled")
          .click();

        // Check error messages
        cy.wait("@saveStreamingRequest");
        cy.get('[data-test="streaming-default-pause-image-field"]').should(
          "include.text",
          "The Default pause image must have a resolution of 1920x1080 pixels.",
        );

        // Check with 500 error
        cy.intercept("POST", "api/v1/roomTypes/3/streaming", {
          statusCode: 500,
          body: {
            message: "Test",
          },
        }).as("saveStreamingRequest");

        cy.get('[data-test="dialog-save-button"]').click();
      });

    cy.wait("@saveStreamingRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check validation errors are removed
    cy.get('[data-test="streaming-default-pause-image-field"]').should(
      "not.include.text",
      "The Default pause image must have a resolution of 1920x1080 pixels.",
    );
  });

  it("edit room type settings loading error", function () {
    cy.visit("/admin/streaming_settings");

    // Server error
    cy.intercept("GET", "api/v1/roomTypes/3/streaming", {
      statusCode: 500,
      body: {
        message: "Internal server error",
      },
    }).as("roomTypeStreamingSettingsRequest");

    cy.wait("@streamingRequest");

    cy.get('[data-test="room-type-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-test="room-type-item-cell"]')
          .eq(3)
          .find("button")
          .click();

        cy.wait("@roomTypeStreamingSettingsRequest");
      });

    cy.get('[data-test="streaming-room-type-settings-edit-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check all input fields are not shown
        cy.get('[data-test="streaming-enabled-field"]').should("not.exist");
        cy.get('[data-test="streaming-default-pause-image-field"]').should(
          "not.exist",
        );

        // Check save button is disabled
        cy.get('[data-test="dialog-save-button"]').should("be.disabled");
      });

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Internal server error"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Valid response
    cy.intercept("GET", "api/v1/roomTypes/3/streaming", {
      fixture: "roomTypeStreamingSettings.json",
    }).as("roomTypeStreamingSettingsRequest");

    cy.get('[data-test="streaming-room-type-settings-edit-dialog"]')
      .should("be.visible")
      .within(() => {
        // Try again
        cy.get('[data-test="loading-retry-button"]').click();

        // Check overlay is gone
        cy.get('[data-test="overlay"]').should("not.exist");

        // Check all input fields are shown
        cy.get('[data-test="streaming-enabled-field"]').should("exist");
        cy.get('[data-test="streaming-default-pause-image-field"]').should(
          "exist",
        );

        // Check save button is enabled
        cy.get('[data-test="dialog-save-button"]').should("not.be.disabled");
      });
  });
});
