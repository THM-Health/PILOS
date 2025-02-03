import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Admin users new", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptAdminUsersNewRequests();

    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "admin.view",
        "users.viewAny",
        "users.view",
        "users.update",
        "users.create",
        "users.delete",
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
    cy.testVisitWithoutCurrentUser("/admin/users/new");
  });

  it("visit with user without permission to add new users", function () {
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

    cy.visit("/admin/users/new");

    cy.checkToastMessage("app.flash.unauthorized");

    // Check if the welcome page is shown
    cy.url().should("not.include", "/admin/users");
    cy.get("h1").should("be.visible").and("include.text", "home.title");
  });

  it("visit with local auth disabled", function () {
    cy.intercept("GET", "api/v1/config", { fixture: "config.json" });

    cy.visit("/admin/users/new");

    cy.url().should("not.include", "/admin/users/new");
    cy.url().should("include", "/404");
  });

  it("add new user with custom password and 1 role", function () {
    cy.visit("/admin/users/new");

    // Check general settings and change them
    cy.contains("rooms.settings.general.title").should("be.visible");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.users.index")
      .should("include.text", "admin.breakcrumbs.users.new");

    cy.get('[data-test="firstname-field"]')
      .should("be.visible")
      .and("include.text", "app.firstname")
      .within(() => {
        cy.get("#firstname").should("have.value", "").type("Max");
      });

    cy.get('[data-test="lastname-field"]')
      .should("be.visible")
      .and("include.text", "app.lastname")
      .within(() => {
        cy.get("#lastname").should("have.value", "").type("Doe");
      });

    // Check that breadcrumbs stay the same
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.users.index")
      .should("include.text", "admin.breakcrumbs.users.new");

    cy.get('[data-test="email-field"]')
      .should("be.visible")
      .and("include.text", "app.email")
      .within(() => {
        cy.get("#email").should("have.value", "").type("maxdoe@domain.tld");
      });

    // Check locale setting and change it
    cy.get('[data-test="locale-dropdown-items"]').should("not.exist");
    cy.get('[data-test="locale-field"]')
      .should("be.visible")
      .and("include.text", "admin.users.user_locale")
      .within(() => {
        cy.get('[data-test="locale-dropdown"]')
          .should("have.text", "English")
          .click();
      });

    cy.get('[data-test="locale-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="locale-dropdown-option"]').should("have.length", 3);

        cy.get('[data-test="locale-dropdown-option"]')
          .eq(0)
          .should("have.text", "Deutsch");
        cy.get('[data-test="locale-dropdown-option"]')
          .eq(1)
          .should("have.text", "English");
        cy.get('[data-test="locale-dropdown-option"]')
          .eq(1)
          .should("have.attr", "aria-selected", "true");
        cy.get('[data-test="locale-dropdown-option"]')
          .eq(2)
          .should("have.text", "Français");

        cy.get('[data-test="locale-dropdown-option"]').eq(0).click();
      });

    cy.get('[data-test="locale-dropdown-items"]').should("not.exist");
    cy.get('[data-test="locale-dropdown"]').should("have.text", "Deutsch");

    // Check timezone setting and change it
    cy.get('[data-test="timezone-dropdown-items"]').should("not.exist");
    cy.get('[data-test="timezone-field"]')
      .should("be.visible")
      .and("include.text", "admin.users.timezone")
      .within(() => {
        cy.get('[data-test="timezone-dropdown"]')
          .should("have.text", "UTC")
          .click();
      });

    cy.get('[data-test="timezone-dropdown-items"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="timezone-dropdown-option"]').should(
          "have.length",
          4,
        );

        cy.get('[data-test="timezone-dropdown-option"]')
          .eq(0)
          .should("have.text", "America/New_York");
        cy.get('[data-test="timezone-dropdown-option"]')
          .eq(1)
          .should("have.text", "Australia/Sydney");
        cy.get('[data-test="timezone-dropdown-option"]')
          .eq(2)
          .should("have.text", "Europe/Berlin");
        cy.get('[data-test="timezone-dropdown-option"]')
          .eq(3)
          .should("have.text", "UTC");
        cy.get('[data-test="timezone-dropdown-option"]')
          .eq(3)
          .should("have.attr", "aria-selected", "true");

        cy.get('[data-test="timezone-dropdown-option"]').eq(2).click();
      });

    cy.get('[data-test="timezone-dropdown-items"]').should("not.exist");
    cy.get('[data-test="timezone-dropdown"]').should(
      "have.text",
      "Europe/Berlin",
    );

    // Check role setting and change it
    cy.get(".multiselect__content").should("not.be.visible");
    cy.get('[data-test="role-field"]')
      .should("be.visible")
      .and("include.text", "app.roles")
      .within(() => {
        cy.get('[data-test="role-dropdown"]').within(() => {
          cy.get(".multiselect__tags")
            .should("include.text", "admin.roles.select_roles")
            .click();
          cy.get('[data-test="role-chip"]').should("have.length", 0);
        });
      });

    // Check if correct options are shown
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").should("have.length", 5);
    cy.get(".multiselect__option")
      .eq(0)
      .should("include.text", "Superuser")
      .and("include.text", "admin.roles.superuser")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(1)
      .should("include.text", "Staff")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(2)
      .should("include.text", "Students")
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

    cy.get(".multiselect__option").eq(1).click();

    cy.get(".multiselect__content").should("be.visible");
    cy.get('[data-test="role-dropdown"]').within(() => {
      cy.get('[data-test="role-chip"]').should("have.length", 1);
      cy.get('[data-test="role-chip"]')
        .eq(0)
        .should("have.text", "Staff")
        .find('[data-test="remove-role-button"]')
        .should("not.exist");
    });

    // Select second role
    cy.get(".multiselect__option").eq(2).click();

    // Check that roles are shown and remove second role
    cy.get(".multiselect__content").should("be.visible");
    cy.get('[data-test="role-dropdown"]').within(() => {
      cy.get('[data-test="role-chip"]').should("have.length", 2);
      cy.get('[data-test="role-chip"]')
        .eq(0)
        .should("include.text", "Staff")
        .find('[data-test="remove-role-button"]')
        .should("be.visible");

      cy.get('[data-test="role-chip"]')
        .eq(1)
        .should("include.text", "Students")
        .find('[data-test="remove-role-button"]')
        .should("be.visible")
        .click();
    });

    // Check that dialog is closed
    cy.get(".multiselect__content").should("not.be.visible");

    // Check password settings and change them
    cy.get('[data-test="generate-password-field"]')
      .should("be.visible")
      .and("include.text", "admin.users.generate_password")
      .and("include.text", "admin.users.generate_password_description")
      .within(() => {
        cy.get("#generate_password").and("not.be.checked");
      });

    cy.get('[data-test="new-password-field"]')
      .should("be.visible")
      .and("include.text", "auth.new_password")
      .within(() => {
        cy.get("#new_password").should("have.value", "").type("Password!123");
      });

    cy.get('[data-test="new-password-confirmation-field"]')
      .should("be.visible")
      .and("include.text", "auth.new_password_confirmation")
      .within(() => {
        cy.get("#new_password_confirmation")
          .should("have.value", "")
          .type("Password!123");
      });

    // Save new user
    cy.fixture("userDataUser.json").then((user) => {
      user.data.id = 20;
      user.data.firstname = "Max";
      user.data.lastname = "Doe";
      user.data.email = "maxdoe@domain.tld";
      user.data.roles = [
        {
          id: 2,
          name: "Staff",
        },
      ];
      user.data.locale = "de";
      user.data.timezone = "Europe/Berlin";

      const newUserRequest = interceptIndefinitely(
        "POST",
        "api/v1/users",
        {
          statusCode: 201,
          body: user,
        },
        "newUserRequest",
      );

      cy.intercept("GET", "api/v1/users/20", {
        statusCode: 200,
        body: user,
      }).as("userRequest");

      cy.get('[data-test="overlay"]').should("not.exist");
      cy.get('[data-test="users-new-save-button"]')
        .should("have.text", "app.save")
        .click();

      // Check loading
      cy.get('[data-test="overlay"]').should("be.visible");
      cy.get("#firstname").should("be.disabled");
      cy.get("#lastname").should("be.disabled");
      cy.get("#email").should("be.disabled");
      cy.get('[data-test="locale-dropdown"]').within(() => {
        cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
      });

      cy.get('[data-test="timezone-dropdown"]').within(() => {
        cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
      });
      cy.get('[data-test="role-dropdown"]').should(
        "have.class",
        "multiselect--disabled",
      );
      cy.get("#generate_password").should("be.disabled");
      cy.get("#new_password").should("be.disabled");
      cy.get("#new_password_confirmation").should("be.disabled");

      cy.get('[data-test="users-new-save-button"]')
        .should("be.disabled")
        .then(() => {
          newUserRequest.sendResponse();
        });
    });

    // Check request data
    cy.wait("@newUserRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        firstname: "Max",
        lastname: "Doe",
        email: "maxdoe@domain.tld",
        user_locale: "de",
        timezone: "Europe/Berlin",
        roles: [2],
        generate_password: false,
        new_password: "Password!123",
        new_password_confirmation: "Password!123",
      });
    });
    cy.wait("@userRequest");

    cy.get('[data-test="overlay"]').should("not.exist");

    // Check that user page is shown
    cy.url().should("include", "/admin/users/20");

    // Check that breadcrumbs are shown correctly
    cy.get('[data-test="admin-breadcrumb"]')
      .should("be.visible")
      .should("include.text", "admin.breakcrumbs.users.index")
      .should(
        "include.text",
        'admin.breakcrumbs.users.view_{"firstname":"Max","lastname":"Doe"}',
      );
  });

  it("add new user with generated password and several roles", function () {
    cy.visit("/admin/users/new");

    // Check general settings and change them
    cy.contains("rooms.settings.general.title").should("be.visible");

    cy.get("#firstname").should("have.value", "").type("Max");
    cy.get("#lastname").should("have.value", "").type("Doe");
    cy.get("#email").should("have.value", "").type("maxdoe@domain.tld");

    // Check locale setting and
    cy.get('[data-test="locale-dropdown"]').should("have.text", "English");

    // Check timezone setting
    cy.get('[data-test="timezone-dropdown"]').should("have.text", "UTC");

    // Check role setting and change it
    cy.get(".multiselect__content").should("not.be.visible");
    cy.get('[data-test="role-field"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="role-dropdown"]').within(() => {
          cy.get(".multiselect__tags")
            .should("include.text", "admin.roles.select_roles")
            .click();
          cy.get('[data-test="role-chip"]').should("have.length", 0);
        });
      });

    // Check if correct options are shown
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").should("have.length", 5);
    cy.get(".multiselect__option")
      .eq(0)
      .should("include.text", "Superuser")
      .and("include.text", "admin.roles.superuser")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(1)
      .should("include.text", "Staff")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(2)
      .should("include.text", "Students")
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

    cy.get('[data-test="users-new-save-button"]')
      .should("be.disabled")
      .then(() => {
        userRoleRequest.sendResponse();
      });

    cy.wait("@userRoleRequest");

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
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(1)
      .should("include.text", "Faculty")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(2)
      .should("include.text", "Manager")
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

    // Check that roles are shown
    cy.get(".multiselect__content").should("be.visible");
    cy.get('[data-test="role-dropdown"]').within(() => {
      cy.get('[data-test="role-chip"]').should("have.length", 2);
      cy.get('[data-test="role-chip"]')
        .eq(0)
        .should("include.text", "Dean")
        .find('[data-test="remove-role-button"]')
        .should("be.visible");

      cy.get('[data-test="role-chip"]')
        .eq(1)
        .should("include.text", "Manager")
        .find('[data-test="remove-role-button"]')
        .should("be.visible");
    });

    // Close dialog
    cy.get(".multiselect__select").click({ force: true }); // ToDo remove force when possible

    // Check that dialog is closed
    cy.get(".multiselect__content").should("not.be.visible");

    // Check password settings and change them
    cy.get("#generate_password").and("not.be.checked").click();

    cy.get('[data-test="new-password-field"]').should("not.exist");
    cy.get('[data-test="new-password-confirmation-field"]').should("not.exist");

    // Save new user
    cy.fixture("userDataUser.json").then((user) => {
      user.data.id = 20;
      user.data.firstname = "Max";
      user.data.email = "Doe";
      user.data.roles = [
        {
          id: 4,
          name: "Dean",
        },
        {
          id: 6,
          name: "Manager",
        },
      ];

      cy.intercept("POST", "api/v1/users", {
        statusCode: 201,
        body: user,
      }).as("newUserRequest");

      cy.intercept("GET", "api/v1/users/20", {
        statusCode: 200,
        body: user,
      }).as("userRequest");
    });

    cy.get('[data-test="users-new-save-button"]').click();

    // Check request data
    cy.wait("@newUserRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        firstname: "Max",
        lastname: "Doe",
        email: "maxdoe@domain.tld",
        user_locale: "en",
        timezone: "UTC",
        roles: [4, 6],
        generate_password: true,
      });
    });
    cy.wait("@userRequest");

    // Check that user page is shown
    cy.url().should("include", "/admin/users/20");
  });

  it("add new user errors", function () {
    cy.visit("/admin/users/new");

    // Set values
    cy.get("#firstname").should("have.value", "").type("Max");
    cy.get("#lastname").should("have.value", "").type("Doe");
    cy.get("#email").should("have.value", "").type("maxdoe@domain.tld");
    cy.get('[data-test="locale-dropdown"]').should("have.text", "English");
    cy.get('[data-test="timezone-dropdown"]').should("have.text", "UTC");
    cy.get('[data-test="role-dropdown"]').click();
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").eq(0).click();
    cy.get(".multiselect__select").click();
    cy.get(".multiselect__content").should("not.be.visible");
    cy.get("#new_password").type("Password!123");
    cy.get("#new_password_confirmation").type("Password!123");

    // Check with 422 error
    cy.intercept("POST", "api/v1/users", {
      statusCode: 422,
      body: {
        message: "The given data was invalid.",
        errors: {
          firstname: ["The Firstname field is required."],
          lastname: ["The Lastname field is required."],
          email: ["The Email field is required."],
          user_locale: ["The user locale field is required."],
          timezone: ["The timezone field is required."],
          roles: ["The Roles field is required."],
          generate_password: ["The generate password field is required."],
          new_password: [
            "The New password field is required when generate password is false.",
          ],
          new_password_confirmation: [
            "The new password confirmation field is required.",
          ],
        },
      },
    }).as("newUserRequest");

    cy.get('[data-test="users-new-save-button"]').click();

    cy.wait("@newUserRequest");

    cy.get('[data-test="firstname-field"]').should(
      "include.text",
      "The Firstname field is required.",
    );
    cy.get('[data-test="lastname-field"]').should(
      "include.text",
      "The Lastname field is required.",
    );
    cy.get('[data-test="email-field"]').should(
      "include.text",
      "The Email field is required.",
    );
    cy.get('[data-test="locale-field"]').should(
      "include.text",
      "The user locale field is required.",
    );
    cy.get('[data-test="timezone-field"]').should(
      "include.text",
      "The timezone field is required.",
    );
    cy.get('[data-test="role-field"]').should(
      "include.text",
      "The Roles field is required.",
    );
    cy.get('[data-test="generate-password-field"]').should(
      "include.text",
      "The generate password field is required.",
    );
    cy.get('[data-test="new-password-field"]').should(
      "include.text",
      "The New password field is required when generate password is false.",
    );
    cy.get('[data-test="new-password-confirmation-field"]').should(
      "include.text",
      "The new password confirmation field is required.",
    );

    // Check with 500 error
    cy.intercept("POST", "api/v1/users", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("newUserRequest");

    cy.get('[data-test="users-new-save-button"]').click();

    cy.wait("@newUserRequest");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that 422 error messages are hidden
    cy.get('[data-test="firstname-field"]').should(
      "not.include.text",
      "The Firstname field is required.",
    );
    cy.get('[data-test="lastname-field"]').should(
      "not.include.text",
      "The Lastname field is required.",
    );
    cy.get('[data-test="email-field"]').should(
      "not.include.text",
      "The Email field is required.",
    );
    cy.get('[data-test="locale-field"]').should(
      "not.include.text",
      "The user locale field is required.",
    );
    cy.get('[data-test="timezone-field"]').should(
      "not.include.text",
      "The timezone field is required.",
    );
    cy.get('[data-test="role-field"]').should(
      "not.include.text",
      "The Roles field is required.",
    );
    cy.get('[data-test="generate-password-field"]').should(
      "not.include.text",
      "The generate password field is required.",
    );
    cy.get('[data-test="new-password-field"]').should(
      "not.include.text",
      "The New password field is required when generate password is false.",
    );
    cy.get('[data-test="new-password-confirmation-field"]').should(
      "not.include.text",
      "The new password confirmation field is required.",
    );

    // Check with 401 error
    cy.intercept("POST", "api/v1/users", {
      statusCode: 401,
    }).as("newUserRequest");

    cy.get('[data-test="users-new-save-button"]').click();

    cy.wait("@newUserRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users/new");

    cy.checkToastMessage("app.flash.unauthenticated");
  });

  it("load timezones errors", function () {
    // Check with 500 error
    const loadTimezonesRequest = interceptIndefinitely(
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

    cy.visit("/admin/users/new");

    // Check loading
    cy.get('[data-test="users-new-save-button"]').should("be.disabled");

    cy.get('[data-test="timezone-dropdown"]')
      .find(".p-select-label")
      .should("have.attr", "aria-disabled", "true")
      .then(() => {
        loadTimezonesRequest.sendResponse();
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

    cy.get('[data-test="users-new-save-button"]').should("be.disabled");

    // Reload timezones without errors
    cy.intercept("GET", "api/v1/getTimezones", {
      fixture: "timezones.json",
    }).as("timezonesRequest");

    cy.get('[data-test="timezone-reload-button"]').click();

    cy.wait("@timezonesRequest");

    cy.get('[data-test="users-new-save-button"]').should("not.be.disabled");

    cy.get('[data-test="timezone-dropdown"]')
      .should("have.text", "UTC")
      .find(".p-select-label")
      .should("not.have.attr", "aria-disabled", "true");

    cy.get('[data-test="timezone-reload-button"]').should("not.exist");

    cy.get('[data-test="timezone-dropdown"]').click();

    cy.get('[data-test="timezone-dropdown-option"]').should("have.length", 4);

    //Check with 401 error
    cy.intercept("GET", "api/v1/getTimezones", {
      statusCode: 401,
    }).as("timezonesRequest");

    cy.reload();

    cy.wait("@timezonesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users/new");

    cy.checkToastMessage("app.flash.unauthenticated");
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

    cy.visit("/admin/users/new");

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
      .and("not.have.class", "multiselect__option--selected");
    cy.get(".multiselect__option")
      .eq(2)
      .should("include.text", "Students")
      .and("not.include.text", "admin.roles.automatic")
      .and("not.include.text", "admin.roles.superuser")
      .and("be.visible")
      .and("not.have.class", "multiselect__option--disabled");
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

    cy.visit("/admin/users/new");

    // Check loading
    cy.get('[data-test="users-new-save-button"]').should("be.disabled");

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

    cy.get('[data-test="users-new-save-button"]').should("be.disabled");

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

    cy.get('[data-test="users-new-save-button"]').should("not.be.disabled");

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

    cy.get('[data-test="roles-reload-button"]').should("be.visible");

    cy.get('[data-test="users-new-save-button"]').should("be.disabled");

    // Check with 401 error
    cy.intercept("GET", "api/v1/roles*", {
      statusCode: 401,
    }).as("rolesRequest");

    cy.reload();

    cy.wait("@rolesRequest");

    // Check that redirect worked and error message is shown
    cy.url().should("include", "/login?redirect=/admin/users/new");

    cy.checkToastMessage("app.flash.unauthenticated");

    // Visit new page again with roles
    cy.intercept("GET", "api/v1/roles*", {
      fixture: "roles.json",
    }).as("rolesRequest");

    cy.visit("/admin/users/new");

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
    cy.url().should("include", "/login?redirect=/admin/users/new");

    cy.checkToastMessage("app.flash.unauthenticated");
  });
});
