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
      currentUser.data.permissions = ["admin.view", "streaming.viewAny"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
  });

  it("check settings with streaming disabled", function () {
    cy.fixture("config.json").then((config) => {
      config.data.streaming.enabled = false;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.visit("/admin/streaming_settings");

    // check 404
    cy.url().should("include", "/404");
  });

  it("check settings with only view permission", function () {
    cy.visit("/admin/streaming_settings");

    cy.wait("@streamingRequest");

    cy.contains("admin.streaming.general.title");

    cy.get('[data-test="default-pause-image-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.default_pause_image")
      .within(() => {
        cy.checkSettingsFileSelectorOnlyView("");
      });

    cy.get('[data-test="css-file-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.css_file")
      .within(() => {
        cy.checkSettingsFileSelectorOnlyView("");
      });

    cy.get('[data-test="join-parameters-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.join_parameters")
      .and("include.text", "admin.streaming.join_parameters_description")
      .within(() => {
        cy.get("#join-parameters").should("have.value", "").and("be.disabled");
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
        cy.checkSettingsFileSelectorOnlyView("https://example.com/image.png");
      });

    cy.get('[data-test="css-file-field"]')
      .should("be.visible")
      .and("include.text", "admin.streaming.css_file")
      .within(() => {
        cy.checkSettingsFileSelectorOnlyView(
          "https://example.com/streaming.css",
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
          .and("be.disabled");
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
        cy.get('[data-test="room-type-item-cell"]').should("have.length", 3);
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
        cy.get('[data-test="room-type-item-cell"]').should("have.length", 3);
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
        cy.get('[data-test="room-type-item-cell"]').should("have.length", 3);
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
});
