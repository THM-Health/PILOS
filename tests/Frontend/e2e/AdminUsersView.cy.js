import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe.skip("Admin users view", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminUsersViewRequests();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.create",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.fixture("config.json").then((config) => {
      config.data.auth.local = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });
  });

  it("visit with user that is not logged in", function () {
    cy.testVisitWithoutCurrentUser("/admin/users/");
  });

  it("visit with user without permission to view users", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.create",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users/2");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if welcome page is shown
    cy.url().should("not.include", "/admin/users/2");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("check userView shown correctly", function () {
    const userRequest = interceptIndefinitely(
      "GET",
      "api/v1/users/2",
      { fixture: "userDataUser.json" },
      "userRequest",
    );

    cy.visit("/admin/users/2");

    cy.contains("admin.title");

    // Check loading
    cy.get('[data-test="users-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="users-edit-button"]').should("not.exist");
    cy.get('[data-test="users-reset-password-button"]').should("not.exist");
    cy.get('[data-test="users-delete-button"]').should("not.exist");
    cy.get('[data-test="user-tab-profile-save-button"]').should("not.exist");

    cy.get('[data-test="base-tab-button"]').should("not.exist");
    cy.get('[data-test="email-tab-button"]').should("not.exist");
    cy.get('[data-test="security-tab-button"]').should("not.exist");
    cy.get('[data-test="others-tab-button"]').should("not.exist");

    cy.get('[data-test="overlay"]')
      .should("be.visible")
      .then(() => {
        userRequest.sendResponse();
      });

    cy.wait("@userRequest");

    cy.get('[data-test="overlay"]').should("not.exist");

    cy.get('[data-test="users-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="users-edit-button"]').should("not.exist");
    cy.get('[data-test="users-reset-password-button"]').should("not.exist");
    cy.get('[data-test="users-delete-button"]').should("not.exist");
    cy.get('[data-test="user-tab-profile-save-button"]').should("not.exist");

    cy.get('[data-test="base-tab-button"]').should("be.visible");
    cy.get('[data-test="email-tab-button"]').should("be.visible");
    cy.get('[data-test="security-tab-button"]').should("be.visible");
    cy.get('[data-test="others-tab-button"]').should("be.visible");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breadcrumbs.users.index")
      .should(
        "include.text",
        'admin.breadcrumbs.users.view_{"firstname":"Laura","lastname":"Rivera"}',
      );

    // Check that user data is shown and all inputs are disabled
    // Base tab
    cy.get('[data-test="firstname-field"]')
      .should("be.visible")
      .and("include.text", "app.firstname")
      .within(() => {
        cy.get("#firstname").should("have.value", "Laura").and("be.disabled");
      });

    cy.get('[data-test="lastname-field"]')
      .should("be.visible")
      .and("include.text", "app.lastname")
      .within(() => {
        cy.get("#lastname").should("have.value", "Rivera").and("be.disabled");
      });

    cy.get('[data-test="authenticator-field"]')
      .should("be.visible")
      .and("include.text", "admin.users.authenticator.title")
      .within(() => {
        cy.get("#authenticator")
          .should("have.value", "admin.users.authenticator.local")
          .and("be.disabled");
      });

    // Check that profile image buttons are hidden
    cy.get('[data-test="profile-image-field"]')
      .should("be.visible")
      .and("include.text", "admin.users.image.title")
      .within(() => {
        cy.get('[data-test="reset-file-upload-button"]').should("not.exist");
        cy.get('[data-test="delete-image-button"]').should("not.exist");
        cy.get('[data-test="undo-delete-button"]').should("not.exist");
        cy.get('[data-test="upload-file-input"]').should("not.exist");
      });

    cy.get('[data-test="locale-field"]')
      .should("be.visible")
      .and("include.text", "admin.users.user_locale")
      .within(() => {
        cy.get('[data-test="locale-dropdown"]').within(() => {
          cy.get(".p-select-label").should(
            "have.attr",
            "aria-disabled",
            "true",
          );
        });
      });

    cy.get('[data-test="timezone-field"]')
      .should("be.visible")
      .and("include.text", "admin.users.timezone")
      .within(() => {
        cy.get('[data-test="timezone-dropdown"]').within(() => {
          cy.get(".p-select-label").should(
            "have.attr",
            "aria-disabled",
            "true",
          );
        });
      });

    // Check that save button is hidden
    cy.get('[data-test="user-tab-profile-save-button"]').should("not.exist");

    // Email tab
    cy.get('[data-test="email-tab-button"]').click();

    // Check that tab hash is set
    cy.url().should("include", "/admin/users/2#tab=email");

    cy.get('[data-test="email-tab-current-password-field"]').should(
      "not.exist",
    );

    cy.get('[data-test="email-field"]')
      .should("be.visible")
      .and("include.text", "app.email")
      .within(() => {
        cy.get("#email")
          .should("have.value", "LauraWRivera@domain.tld")
          .and("be.disabled");
      });

    // Check that save button is hidden
    cy.get('[data-test="user-tab-email-save-button"]').should("not.exist");

    // Security tab
    cy.get('[data-test="security-tab-button"]').click();

    // Check that tab hash is set
    cy.url().should("include", "/admin/users/2#tab=security");

    cy.get('[data-test="roles-field"]')
      .should("be.visible")
      .and("include.text", "app.roles")
      .within(() => {
        cy.get('[data-test="role-dropdown"]')
          .should("have.class", "multiselect--disabled")
          .within(() => {
            cy.get('[data-test="role-chip"]').should("have.length", 2);
            cy.get('[data-test="role-chip"]')
              .eq(0)
              .should("include.text", "Students")
              .find('[data-test="remove-role-button"]')
              .should("not.exist");
            cy.get('[data-test="role-chip"]')
              .eq(1)
              .should("include.text", "Staff")
              .find('[data-test="remove-role-button"]')
              .should("not.exist");
          });
      });

    // Check that role save button is hidden
    cy.get('[data-test="users-roles-save-button"]').should("not.exist");

    // Check that password fields are hidden
    cy.get('[data-test="security-tab-current-password-field"]').should(
      "not.exist",
    );

    cy.get('[data-test="new-password-field"]').should("not.exist");

    cy.get('[data-test="new-password-confirmation-field"]').should("not.exist");

    // Check that password save button is hidden
    cy.get('[data-test="change-password-save-button"]').should("not.exist");

    // Check that sessions are hidden
    cy.get('[data-test="session-panel"]').should("not.exist");

    // Check others tab
    cy.get('[data-test="others-tab-button"]').click();

    // Check that tab hash is set
    cy.url().should("include", "/admin/users/2#tab=others");

    cy.get('[data-test="bbb-skip-check-audio-field"]')
      .should("be.visible")
      .and("include.text", "admin.users.skip_check_audio")
      .find("#bbb_skip_check_audio")
      .should("not.be.checked")
      .and("be.disabled");

    // Check that others save button is hidden
    cy.get('[data-test="user-tab-others-save-button"]').should("not.exist");
  });

  it("check userView with ldap user", function () {
    cy.fixture("userDataUser.json").then((user) => {
      user.data.authenticator = "ldap";
      user.data.external_id = "lwr";

      cy.intercept("GET", "api/v1/users/2", {
        statusCode: 200,
        body: user,
      }).as("userRequest");
    });

    cy.visit("/admin/users/2");

    cy.wait("@userRequest");

    cy.get("#firstname").should("have.value", "Laura").and("be.disabled");
    cy.get("#lastname").should("have.value", "Rivera").and("be.disabled");
    cy.get("#authenticator")
      .should("have.value", "admin.users.authenticator.ldap")
      .and("be.disabled");

    cy.get('[data-test="external-user-id-field"]')
      .should("include.text", "auth.external_user_id")
      .within(() => {
        cy.get("#external-user-id")
          .should("have.value", "lwr")
          .and("be.disabled");
      });

    // Check that profile image buttons are hidden
    cy.get('[data-test="reset-file-upload-button"]').should("not.exist");
    cy.get('[data-test="delete-image-button"]').should("not.exist");
    cy.get('[data-test="undo-delete-button"]').should("not.exist");
    cy.get('[data-test="upload-file-input"]').should("not.exist");
    cy.get('[data-test="user-tab-profile-save-button"]').should("not.exist");

    cy.get('[data-test="locale-dropdown"]').within(() => {
      cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
    });

    cy.get('[data-test="timezone-dropdown"]').within(() => {
      cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
    });

    // Email tab
    cy.get('[data-test="email-tab-button"]').click();

    cy.get("#email")
      .should("have.value", "LauraWRivera@domain.tld")
      .and("be.disabled");

    // Security tab
    cy.get('[data-test="security-tab-button"]').click();

    cy.get('[data-test="role-dropdown"]')
      .should("include.text", "Students")
      .should("include.text", "Staff")
      .should("have.class", "multiselect--disabled");

    // Check others tab
    cy.get('[data-test="others-tab-button"]').click();

    cy.get("#bbb_skip_check_audio").should("not.be.checked").and("be.disabled");
  });

  it("check button visibility with update permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.update",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users/2");

    cy.wait("@userRequest");

    cy.get('[data-test="users-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="users-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.edit")
      .and("have.attr", "href", "/admin/users/2/edit#tab=base");
    cy.get('[data-test="users-reset-password-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="users-delete-button"]').should("not.exist");
  });

  it("check button visibility with delete permission", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.create",
        "users.update",
        "users.delete",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users/2");

    cy.wait("@userRequest");

    cy.get('[data-test="users-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="users-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.edit")
      .and("have.attr", "href", "/admin/users/2/edit#tab=base");
    cy.get('[data-test="users-reset-password-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="users-delete-button"]')
      .should("be.visible")
      .and("not.be.disabled");
  });

  it("check button visibility for user that is superuser", function () {
    // Check when viewing user that is not a superuser
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.create",
        "users.update",
        "users.delete",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users/2");

    cy.wait("@userRequest");

    cy.get('[data-test="users-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="users-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.edit")
      .and("have.attr", "href", "/admin/users/2/edit#tab=base");
    cy.get('[data-test="users-reset-password-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="users-delete-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Check when viewing user that is a superuser
    cy.fixture("userDataUser.json").then((user) => {
      user.data.superuser = true;

      user.data.roles.push({
        id: 1,
        name: "Superuser",
        automatic: true,
        superuser: true,
      });

      cy.intercept("GET", "api/v1/users/2", {
        statusCode: 200,
        body: user,
      }).as("userRequest");
    });

    cy.reload();

    cy.wait("@userRequest");

    cy.get('[data-test="users-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="users-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.edit")
      .and("have.attr", "href", "/admin/users/2/edit#tab=base");
    cy.get('[data-test="users-reset-password-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="users-delete-button"]')
      .should("be.visible")
      .and("not.be.disabled");
  });

  it("check button visibility for user that is no superuser", function () {
    // Check when viewing user that is not a superuser
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.superuser = false;
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.create",
        "users.update",
        "users.delete",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users/2");

    cy.wait("@userRequest");

    cy.get('[data-test="users-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="users-edit-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("include.text", "app.edit")
      .and("have.attr", "href", "/admin/users/2/edit#tab=base");
    cy.get('[data-test="users-reset-password-button"]')
      .should("be.visible")
      .and("not.be.disabled");
    cy.get('[data-test="users-delete-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Check when viewing user that is a superuser
    cy.fixture("userDataUser.json").then((user) => {
      user.data.superuser = true;

      user.data.roles.push({
        id: 1,
        name: "Superuser",
        automatic: true,
        superuser: true,
      });

      cy.intercept("GET", "api/v1/users/2", {
        statusCode: 200,
        body: user,
      }).as("userRequest");
    });

    cy.reload();

    cy.wait("@userRequest");

    cy.get('[data-test="users-cancel-edit-button"]').should("not.exist");
    cy.get('[data-test="users-edit-button"]').should("not.exist");
    cy.get('[data-test="users-reset-password-button"]').should("not.exist");
    cy.get('[data-test="users-delete-button"]').should("not.exist");
  });

  it("visit with invalid tab hash", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.create",
        "users.update",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users/2#tab=invalid");

    cy.wait("@userRequest");

    // Check that base tab is shown
    cy.get("#firstname").should("be.visible");

    // Check that edit button contains base tab as hash parameter
    cy.get('[data-test="users-edit-button"]')
      .should("be.visible")
      .and("have.attr", "href", "/admin/users/2/edit#tab=base");

    // Check that invalid tab is cleared
    cy.url().should("not.include", "#tab=invalid");
  });

  it("open view errors", function () {
    cy.intercept("GET", "api/v1/users/2", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("userRequest");

    cy.visit("admin/users/2");

    cy.wait("@userRequest");

    // Check that overlay is shown
    cy.get('[data-test="overlay"]').should("be.visible");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Reload with correct data
    cy.intercept("GET", "api/v1/users/2", {
      fixture: "userDataUser.json",
    }).as("userRequest");

    cy.get('[data-test="loading-retry-button"]')
      .should("be.visible")
      .and("have.text", "app.reload")
      .click();

    cy.wait("@userRequest");

    // Check that overlay is not shown anymore
    cy.get('[data-test="overlay"]').should("not.exist");
    cy.get('[data-test="loading-retry-button"]').should("not.exist");

    // Reload page with 404 errors
    cy.interceptAdminUsersIndexRequests();

    cy.intercept("GET", "api/v1/users/2", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "user",
        ids: [2],
      },
    }).as("userRequest");

    cy.reload();

    cy.wait("@userRequest");

    // Check that redirect worked
    cy.url().should("not.include", "/admin/users/2");
    cy.url().should("include", "/admin/users");

    cy.wait("@usersRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.user"}',
      'app.flash.model_not_found.details_{"ids":"2"}',
    ]);

    // Reload page with 401 error
    cy.intercept("GET", "api/v1/users/2", {
      statusCode: 401,
    }).as("userRequest");

    cy.visit("/admin/users/2");

    cy.wait("@userRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users/2");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load timezones error", function () {
    const timezonesRequest = interceptIndefinitely(
      "GET",
      "api/v1/getTimezones",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
      "timezonesRequest",
    );

    cy.visit("/admin/users/2");

    cy.wait("@userRequest");

    // Check loading
    cy.get('[data-test="timezone-dropdown"]')
      .find(".p-select-label")
      .should("have.attr", "aria-disabled", "true")
      .then(() => {
        timezonesRequest.sendResponse();
      });

    cy.wait("@timezonesRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    cy.get('[data-test="timezone-dropdown"]')
      .should("have.text", "admin.users.timezone")
      .find(".p-select-label")
      .should("have.attr", "aria-disabled", "true");

    // Reload timezones without error
    cy.intercept("GET", "api/v1/getTimezones", {
      fixture: "timezones.json",
    }).as("timezonesRequest");

    cy.get('[data-test="timezone-reload-button"]').click();

    cy.wait("@timezonesRequest");

    cy.get('[data-test="timezone-dropdown"]')
      .should("have.text", "UTC")
      .find(".p-select-label")
      .should("have.attr", "aria-disabled", "true");

    cy.get('[data-test="timezone-reload-button"]').should("not.exist");

    // Check with 401 error
    cy.intercept("GET", "api/v1/getTimezones", {
      statusCode: 401,
    }).as("timezonesRequest");

    cy.reload();

    cy.wait("@userRequest");

    cy.wait("@timezonesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users/2");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
