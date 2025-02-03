import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin users edit email", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminUsersViewRequests();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.update",
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

  it("check view", function () {
    cy.visit("/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    cy.contains("admin.users.roles_and_permissions").should("be.visible");

    // Check that role-select is enabled and shows the correct roles
    cy.get('[data-test="roles-field"]')
      .should("be.visible")
      .and("include.text", "app.roles")
      .within(() => {
        cy.get('[data-test="role-dropdown"]').within(() => {
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
            .should("be.visible");
        });
      });

    // Check that password fields are shown correctly and try to change password
    cy.get('[data-test="security-tab-current-password-field"]').should(
      "not.exist",
    );

    cy.get('[data-test="new-password-field"]')
      .should("be.visible")
      .and("include.text", "auth.new_password")
      .within(() => {
        cy.get("#new_password").should("have.value", "");
      });

    cy.get('[data-test="new-password-confirmation-field"]')
      .should("be.visible")
      .and("include.text", "auth.new_password_confirmation")
      .within(() => {
        cy.get("#new_password_confirmation").should("have.value", "");
      });

    // Check that essions are not shown
    cy.get('[data-test="session-panel"]').should("not.exist");
  });

  it("check view with external user", function () {
    cy.fixture("userDataUser.json").then((user) => {
      user.data.authenticator = "ldap";
      user.data.external_id = "lwr";

      cy.intercept("GET", "api/v1/users/2", {
        statusCode: 200,
        body: user,
      }).as("userRequest");
    });

    cy.visit("/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    // Check that role select is shown and enabled
    cy.get('[data-test="roles-field"]')
      .should("be.visible")
      .and("include.text", "app.roles")
      .within(() => {
        cy.get('[data-test="role-dropdown"]').should(
          "not.have.class",
          "multiselect--disabled",
        );
      });

    // Check that password fields are hidden
    cy.get('[data-test="security-tab-current-password-field"]').should(
      "not.exist",
    );
    cy.get('[data-test="new-password-field"]').should("not.exist");
    cy.get('[data-test="new-password-confirmation-field"]').should("not.exist");
    cy.get('[data-test="change-password-save-button"]').should("not.exist");

    // Check that sessions are not shown
    cy.get('[data-test="session-panel"]').should("not.exist");
  });

  it("change role", function () {
    cy.visit("/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

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
      .should("be.visible");

    cy.get('[data-test="role-dropdown"]').click();

    // Check if correct options are shown
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").should("have.length", 5);
    cy.get(".multiselect__option")
      .eq(0)
      .should("include.text", "Superuser")
      .and("include.text", "admin.roles.superuser")
      .and("not.include.text", "admin.roles.automatic")
      .and("be.visible")
      .and("not.have.class", "multiselect__option--disabled");
    cy.get(".multiselect__option")
      .eq(1)
      .should("include.text", "Staff")
      .and("not.include.text", "admin.roles.superuser")
      .and("not.include.text", "admin.roles.automatic")
      .and("be.visible")
      .and("not.have.class", "multiselect__option--disabled")
      .and("have.class", "multiselect__option--selected");
    cy.get(".multiselect__option")
      .eq(2)
      .should("include.text", "Students")
      .and("not.include.text", "admin.roles.superuser")
      .and("include.text", "admin.roles.automatic")
      .and("be.visible")
      .and("have.class", "multiselect__option--disabled");
    cy.get(".multiselect__option")
      .eq(3)
      .should(
        "include.text",
        "No elements found. Consider changing the search query.",
      )
      .and("not.be.visible");
    cy.get(".multiselect__option")
      .eq(4)
      .should("include.text", "admin.roles.no_data")
      .and("not.be.visible");
    cy.get(".multiselect__option").eq(0).click();

    // Switch to next page
    const userRoleRequest = interceptIndefinitely(
      "GET",
      "api/v1/roles*",
      {
        statusCode: 200,
        body: {
          data: [
            {
              id: 4,
              name: "Dean",
              default: false,
              updated_at: "2021-01-08T15:51:08.000000Z",
              model_name: "Role",
              room_limit: 20,
            },
            {
              id: 5,
              name: "Faculty",
              default: false,
              updated_at: "2021-03-19T09:12:44.000000Z",
              model_name: "Role",
              room_limit: 20,
            },
            {
              id: 6,
              name: "Manager",
              default: false,
              updated_at: "2021-05-22T11:55:21.000000Z",
              model_name: "Role",
              room_limit: -1,
            },
          ],
          meta: {
            current_page: 2,
            from: 4,
            last_page: 2,
            per_page: 3,
            to: 6,
            total: 6,
          },
        },
      },
      "userRoleRequest",
    );

    cy.get(".multiselect__content")
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="previous-page-button"]')
          .should("include.text", "app.previous_page")
          .and("be.disabled");
        cy.get('[data-test="next-page-button"]')
          .should("include.text", "app.next_page")
          .and("not.be.disabled");

        cy.get('[data-test="next-page-button"]').click();

        // Check loading
        cy.get('[data-test="previous-page-button"]').should("be.disabled");
        cy.get('[data-test="next-page-button"]').should("be.disabled");
      });

    cy.get('[data-test="role-dropdown"]').should(
      "have.class",
      "multiselect--disabled",
    );

    cy.get('[data-test="users-roles-save-button"]')
      .should("be.disabled")
      .then(() => {
        userRoleRequest.sendResponse();
      });

    cy.wait("@userRoleRequest");

    cy.get('[data-test="users-roles-save-button"]').should("not.be.disabled");

    cy.get(".multiselect__content")
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="previous-page-button"]').should("not.be.disabled");
        cy.get('[data-test="next-page-button"]').should("be.disabled");
      });

    cy.get(".multiselect__option").should("have.length", 5);
    cy.get(".multiselect__option")
      .eq(0)
      .should("include.text", "Dean")
      .and("not.include.text", "admin.roles.superuser")
      .and("not.include.text", "admin.roles.automatic")
      .and("not.have.class", "multiselect__option--disabled")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(1)
      .should("include.text", "Faculty")
      .and("not.include.text", "admin.roles.superuser")
      .and("not.include.text", "admin.roles.automatic")
      .and("not.have.class", "multiselect__option--disabled")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(2)
      .should("include.text", "Manager")
      .and("not.include.text", "admin.roles.superuser")
      .and("not.include.text", "admin.roles.automatic")
      .and("not.have.class", "multiselect__option--disabled")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(3)
      .should(
        "include.text",
        "No elements found. Consider changing the search query.",
      )
      .and("not.be.visible");
    cy.get(".multiselect__option")
      .eq(4)
      .should("include.text", "admin.roles.no_data")
      .and("not.be.visible");

    // Select roles
    cy.get(".multiselect__option").eq(0).click();
    cy.get(".multiselect__option").eq(2).click();

    // Check that roles are shown correctly and remove one role
    cy.get(".multiselect__content").should("be.visible");
    cy.get('[data-test="role-dropdown"]').within(() => {
      cy.get('[data-test="role-chip"]').should("have.length", 5);
      cy.get('[data-test="role-chip"]')
        .eq(0)
        .should("include.text", "Students")
        .find('[data-test="remove-role-button"]')
        .should("not.exist");

      cy.get('[data-test="role-chip"]')
        .eq(1)
        .should("include.text", "Staff")
        .find('[data-test="remove-role-button"]')
        .should("be.visible");
      cy.get('[data-test="role-chip"]')
        .eq(2)
        .should("include.text", "Superuser")
        .find('[data-test="remove-role-button"]')
        .should("be.visible");
      cy.get('[data-test="role-chip"]')
        .eq(3)
        .should("include.text", "Dean")
        .find('[data-test="remove-role-button"]')
        .should("be.visible");

      cy.get('[data-test="role-chip"]')
        .eq(4)
        .should("include.text", "Manager")
        .find('[data-test="remove-role-button"]')
        .should("be.visible");

      cy.get('[data-test="role-chip"]')
        .eq(1)
        .find('[data-test="remove-role-button"]')
        .click();
    });

    // Check that dropdown is hidden
    cy.get(".multiselect__content").should("not.be.visible");

    // Save new roles
    cy.fixture("userDataUser").then((user) => {
      user.data.roles = [
        { id: 1, name: "Superuser", automatic: false, superuser: true },
        { id: 3, name: "Students", automatic: true, superuser: false },
        { id: 4, name: "Dean", automatic: false, superuser: false },
        { id: 6, name: "Manager", automatic: false, superuser: false },
      ];

      const saveChangesRequest = interceptIndefinitely(
        "PUT",
        "api/v1/users/2",
        {
          statusCode: 200,
          body: user,
        },
        "saveChangesRequest",
      );

      cy.intercept("GET", "/api/v1/users/2", {
        statusCode: 200,
        body: user,
      }).as("userRequest");

      cy.get('[data-test="users-roles-save-button"]')
        .should("have.text", "app.save")
        .click();

      // Check loading
      cy.get('[data-test="role-dropdown"]').should(
        "have.class",
        "multiselect--disabled",
      );
      cy.get('[data-test="users-roles-save-button"]')
        .should("be.disabled")
        .then(() => {
          saveChangesRequest.sendResponse();
        });
    });

    cy.wait("@saveChangesRequest").then((interception) => {
      expect(interception.request.body).to.deep.include({
        roles: [3, 1, 4, 6],
      });
    });

    // Check that redirect to user view worked
    cy.url().should("include", "/admin/users/2");
    cy.url().should("not.include", "/edit");

    cy.wait("@userRequest");
  });

  it("check that superuser role is disabled for users that are not superusers", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.superuser = false;
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.update",
        "users.create",
        "roles.viewAny",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    cy.visit("/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    cy.get('[data-test="role-dropdown"]').click();

    // Check if correct options are shown
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").should("have.length", 5);
    cy.get(".multiselect__option")
      .eq(0)
      .should("include.text", "Superuser")
      .and("include.text", "admin.roles.superuser")
      .and("not.include.text", "admin.roles.automatic")
      .and("be.visible")
      .and("have.class", "multiselect__option--disabled");
    cy.get(".multiselect__option")
      .eq(1)
      .should("include.text", "Staff")
      .and("not.include.text", "admin.roles.superuser")
      .and("not.include.text", "admin.roles.automatic")
      .and("be.visible")
      .and("not.have.class", "multiselect__option--disabled")
      .and("have.class", "multiselect__option--selected");
    cy.get(".multiselect__option")
      .eq(2)
      .should("include.text", "Students")
      .and("include.text", "admin.roles.automatic")
      .and("not.include.text", "admin.roles.superuser")
      .and("be.visible")
      .and("have.class", "multiselect__option--disabled");
    cy.get(".multiselect__option")
      .eq(3)
      .should(
        "include.text",
        "No elements found. Consider changing the search query.",
      )
      .and("not.be.visible");
    cy.get(".multiselect__option")
      .eq(4)
      .should("include.text", "admin.roles.no_data")
      .and("not.be.visible");
  });

  it("change role errors", function () {
    cy.visit("/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    // Check with 422 error
    cy.intercept("PUT", "api/v1/users/2", {
      statusCode: 422,
      body: {
        errors: {
          roles: ["The roles field is required."],
        },
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="users-roles-save-button"]').click();

    cy.wait("@saveChangesRequest");

    cy.get('[data-test="roles-field"]').should(
      "include.text",
      "The roles field is required.",
    );

    // Check with 500 error
    cy.intercept("PUT", "api/v1/users/2", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="users-roles-save-button"]').click();

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that 422 error messages are hidden
    cy.get('[data-test="roles-field"]').should(
      "not.include.text",
      "The roles field is required.",
    );

    // Check with 428 error (stale error)
    cy.fixture("userDataUser.json").then((user) => {
      user.data.roles = [
        { id: 3, name: "Students", automatic: true },
        { id: 4, name: "Dean", automatic: false },
        { id: 6, name: "Manager", automatic: false },
      ];
      user.data.user_locale = "de";
      user.data.timezone = "Europe/Berlin";

      cy.intercept("PUT", "api/v1/users/2", {
        statusCode: 428,
        body: {
          message: " The user entity was updated in the meanwhile!",
          new_model: user.data,
        },
      }).as("saveChangesRequest");

      cy.intercept("GET", "api/v1/users/2", {
        statusCode: 200,
        body: user,
      }).as("userRequest");
    });

    cy.get('[data-test="stale-user-dialog"]').should("not.exist");

    cy.get('[data-test="users-roles-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that stale dialog is shown
    cy.get('[data-test="stale-user-dialog"]')
      .should("be.visible")
      .and("include.text", "The user entity was updated in the meanwhile!");

    cy.get('[data-test="stale-dialog-reload-button"]').click();

    // Check that redirected to view page
    cy.url().should("include", "/admin/users/2");
    cy.url().should("not.include", "/edit");

    cy.wait("@userRequest");

    // Visit edit page again
    cy.visit("/admin/users/2/edit");

    cy.get('[data-test="security-tab-button"]').click();

    // Check with 404 error
    cy.interceptAdminUsersIndexRequests();
    cy.intercept("PUT", "api/v1/users/2 ", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="users-roles-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("not.include", "/admin/users/2/edit");
    cy.url().should("include", "/admin/users");

    cy.wait("@usersRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"No query results for model"}',
      'app.flash.server_error.error_code_{"statusCode":404}',
    ]);

    // Visit edit page again
    cy.visit("/admin/users/2/edit");
    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    // Check with 401 error
    cy.intercept("PUT", "api/v1/users/2", {
      statusCode: 401,
    }).as("saveChangesRequest");

    cy.get('[data-test="users-roles-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users/2/edit");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("change password", function () {
    cy.visit("/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    // Type in new password and confirmation
    cy.get("#new_password").type("secretPassword123#");
    cy.get("#new_password_confirmation").type("secretPassword123#");

    // Try to change password
    cy.fixture("userDataUser").then((user) => {
      const saveChangesRequest = interceptIndefinitely(
        "PUT",
        "api/v1/users/2/password",
        {
          statusCode: 200,
          body: user,
        },
        "saveChangesRequest",
      );

      cy.get('[data-test="change-password-save-button"]')
        .should("have.text", "auth.change_password")
        .click();

      // Check loading
      cy.get("#new_password").should("be.disabled");
      cy.get("#new_password_confirmation")
        .should("be.disabled")
        .then(() => {
          saveChangesRequest.sendResponse();
        });
    });

    cy.wait("@saveChangesRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        new_password: "secretPassword123#",
        new_password_confirmation: "secretPassword123#",
      });
    });

    // Check that message is shown
    cy.checkToastMessage("auth.flash.password_changed");

    // Check that redirect to user view worked
    cy.url().should("include", "/admin/users/2");
    cy.url().should("not.include", "/edit");

    cy.wait("@userRequest");
  });

  it("change password errors", function () {
    cy.visit("/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    cy.get('[data-test="new-password-field"]').type(" ");
    cy.get('[data-test="new-password-confirmation-field"]').type(" ");

    // Check with 422 error
    cy.intercept("PUT", "api/v1/users/2/password", {
      statusCode: 422,
      body: {
        errors: {
          new_password: ["The New password field is required."],
          new_password_confirmation: [
            "The New password confirmation field is required.",
          ],
        },
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="change-password-save-button"]').click();

    cy.wait("@saveChangesRequest");

    cy.get('[data-test="new-password-field"]').should(
      "include.text",
      "The New password field is required.",
    );

    cy.get('[data-test="new-password-confirmation-field"]').should(
      "include.text",
      "The New password confirmation field is required.",
    );

    // Check with 500 error
    cy.get('[data-test="new-password-field"]')
      .should("have.value", "")
      .type("newSecretPassword123#");

    cy.get('[data-test="new-password-confirmation-field"]')
      .should("have.value", "")
      .type("newSecretPassword123#");

    cy.intercept("PUT", "api/v1/users/2/password", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="change-password-save-button"]').click();

    cy.wait("@saveChangesRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that 422 error messages are hidden
    cy.get('[data-test="new-password-field"]').should(
      "not.include.text",
      "The New password field is required.",
    );

    cy.get('[data-test="new-password-confirmation-field"]').should(
      "not.include.text",
      "The New password confirmation field is required.",
    );

    // Check with 404 error
    cy.get('[data-test="new-password-field"]')
      .should("have.value", "")
      .type("newSecretPassword123#");

    cy.get('[data-test="new-password-confirmation-field"]')
      .should("have.value", "")
      .type("newSecretPassword123#");

    cy.interceptAdminUsersIndexRequests();
    cy.intercept("PUT", "api/v1/users/2/password", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("saveChangesRequest");

    cy.get('[data-test="change-password-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("not.include", "/admin/users/2/edit");
    cy.url().should("include", "/admin/users");

    cy.wait("@usersRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"No query results for model"}',
      'app.flash.server_error.error_code_{"statusCode":404}',
    ]);

    // Visit edit page again
    cy.visit("/admin/users/2/edit");
    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    // Check 401 error
    cy.get('[data-test="new-password-field"]')
      .should("have.value", "")
      .type("newSecretPassword123#");

    cy.get('[data-test="new-password-confirmation-field"]')
      .should("have.value", "")
      .type("newSecretPassword123#");

    cy.intercept("PUT", "api/v1/users/2/password", {
      statusCode: 401,
    }).as("saveChangesRequest");

    cy.get('[data-test="change-password-save-button"]').click();

    cy.wait("@saveChangesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users/2/edit");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load roles errors", function () {
    // Check with 500 error
    const rolesRequest = interceptIndefinitely(
      "GET",
      "api/v1/roles*",
      {
        statusCode: 500,
        body: {
          message: "Test",
        },
      },
      "rolesRequest",
    );

    cy.visit("/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    // Check loading
    cy.get('[data-test="users-roles-save-button"]').should("be.disabled");

    cy.get('[data-test="role-dropdown"]')
      .should("have.class", "multiselect--disabled")
      .then(() => {
        rolesRequest.sendResponse();
      });

    cy.wait("@rolesRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    cy.get('[data-test="role-dropdown"]').should(
      "have.class",
      "multiselect--disabled",
    );

    cy.get('[data-test="users-roles-save-button"]').should("be.disabled");

    // Reload roles without errors
    cy.intercept("GET", "api/v1/roles*", {
      fixture: "roles.json",
    }).as("rolesRequest");

    cy.get('[data-test="roles-reload-button"]').click();

    cy.wait("@rolesRequest");

    cy.get('[data-test="role-dropdown"]').should(
      "not.have.class",
      "multiselect--disabled",
    );

    cy.get('[data-test="users-roles-save-button"]').should("not.be.disabled");

    cy.get('[data-test="roles-reload-button"]').should("not.exist");

    cy.get('[data-test="role-dropdown"]').click();

    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").should("have.length", 5);

    // Check with 500 error when switching pages
    cy.intercept("GET", "api/v1/roles*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("rolesRequest");

    cy.get(".multiselect__content").should("be.visible");
    cy.get('[data-test="next-page-button"]').click();

    cy.wait("@rolesRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    cy.get('[data-test="role-dropdown"]').should(
      "have.class",
      "multiselect--disabled",
    );

    cy.get('[data-test="users-roles-save-button"]').should("be.disabled");

    // Check with 401 error
    cy.intercept("GET", "api/v1/roles*", {
      statusCode: 401,
    }).as("rolesRequest");

    cy.reload();

    cy.get('[data-test="security-tab-button"]').click();

    cy.wait("@rolesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users/2/edit");

    cy.checkToastMessage("app.flash.unauthenticated");

    // Visit edit page again with roles
    cy.intercept("GET", "api/v1/roles*", {
      fixture: "roles.json",
    }).as("rolesRequest");

    cy.visit("/admin/users/2/edit");

    cy.wait("@userRequest");

    cy.get('[data-test="security-tab-button"]').click();

    cy.wait("@rolesRequest");

    cy.get('[data-test="role-dropdown"]').click();

    // Check with 401 error when switching pages
    cy.intercept("GET", "api/v1/roles*", {
      statusCode: 401,
    }).as("rolesRequest");

    cy.get(".multiselect__content").should("be.visible");

    cy.get('[data-test="next-page-button"]').click();

    cy.wait("@rolesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users/2/edit");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
