import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Login", function () {
  beforeEach(function () {
    cy.intercept("GET", "api/v1/locale/en", { fixture: "en.json" });
  });

  it("ldap login", function () {
    // Intercept config request to only show ldap login tab
    cy.fixture("config.json").then((config) => {
      config.data.auth.ldap = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });
    // Intercept csrf-cookie request to set defined cookie that can be checked later
    cy.intercept("GET", "/sanctum/csrf-cookie", {
      statusCode: 200,
      headers: {
        "Set-Cookie": "XSRF-TOKEN=test-csrf; Path=/",
      },
    }).as("cookieRequest");

    // Intercept login request
    const loginRequest = interceptIndefinitely(
      "POST",
      "api/v1/login/ldap",
      {
        statusCode: 200,
      },
      "loginRequest",
    );

    cy.visit("/login");

    cy.get('[data-test="login-tab-button-ldap"]').click();

    cy.get('[data-test="username-field"]')
      .should("be.visible")
      .and("include.text", "auth.ldap.username")
      .within(() => {
        cy.get("#ldap-username").should("have.value", "").type("user");
      });

    cy.get('[data-test="password-field"]')
      .should("be.visible")
      .and("include.text", "auth.password")
      .within(() => {
        cy.get("#ldap-password").should("have.value", "").type("password");
      });

    // Intercept requests that will be needed to show the room index page (needed to check redirect)
    cy.intercept("GET", "api/v1/currentUser", {
      fixture: "currentUser.json",
    });
    cy.interceptRoomIndexRequests();

    cy.get('[data-test="login-button"]')
      .should("have.text", "auth.login")
      .click();
    // Check loading
    cy.get("#ldap-username").should("be.disabled");
    cy.get("#ldap-password").should("be.disabled");

    // Check if button is disabled after being clicked and loading and send response
    cy.get('[data-test="login-button"]')
      .should("be.disabled")
      .and("have.class", "p-button-loading")
      .then(() => {
        cy.wait("@cookieRequest");
        loginRequest.sendResponse();
      });

    // Check if correct data gets sent
    cy.wait("@loginRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        username: "user",
        password: "password",
      });
      expect(interception.request.headers).to.contain({
        "x-xsrf-token": "test-csrf",
      });
    });

    // Check toast message
    cy.checkToastMessage("auth.flash.login");
    // Check if redirect works
    cy.url().should("include", "/rooms").and("not.include", "/login");
  });

  it("hide ldap login if disabled", function () {
    // Intercept config request to only show ldap login tab
    cy.fixture("config.json").then((config) => {
      config.data.auth.local = true;
      config.data.auth.ldap = false;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      }).as("configRequest");
    });

    cy.visit("/login");

    cy.wait("@configRequest");

    cy.get('[data-test="login-tab-button-local"]').should("exist");
    cy.get('[data-test="login-tab-button-ldap"]').should("not.exist");
  });

  it("ldap login with redirect query set", function () {
    // Intercept config request to only show ldap login tab
    cy.fixture("config.json").then((config) => {
      config.data.auth.ldap = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    // Intercept login request
    cy.intercept("POST", "api/v1/login/ldap", {
      statusCode: 200,
    }).as("loginRequest");

    // Visit page that can only be visited by logged in users
    cy.visit("/admin");

    // Check redirect to the login page
    cy.url().should("include", "/login?redirect=/admin");

    // Intercept user request (user that has the permission to show the config page)
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    // Log in the user
    cy.get('[data-test="login-tab-button-ldap"]').click();
    cy.get('[data-test="username-field"]').type("user");
    cy.get('[data-test="password-field"]').type("password");
    cy.get('[data-test="login-button"]').click();

    cy.wait("@loginRequest");

    // Check toast message
    cy.checkToastMessage("auth.flash.login");

    // Check if redirect works
    cy.url().should("include", "/admin").and("not.include", "/login");
  });

  it("local login", function () {
    // Intercept config request to only show local login tab
    cy.fixture("config.json").then((config) => {
      config.data.auth.local = true;
      config.data.user.password_change_allowed = false;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    // Intercept csrf-cookie request to set defined cookie that can be checked later
    cy.intercept("GET", "/sanctum/csrf-cookie", {
      statusCode: 200,
      headers: {
        "Set-Cookie": "XSRF-TOKEN=test-csrf; Path=/",
      },
    }).as("cookieRequest");

    // Intercept login request
    const loginRequest = interceptIndefinitely(
      "POST",
      "api/v1/login/local",
      {
        statusCode: 200,
      },
      "loginRequest",
    );

    cy.visit("/login");

    // Check if local login tab is shown correctly and click on login button
    cy.get('[data-test="login-tab-button-local"]').click();
    cy.get('[data-test="email-field"]')
      .should("be.visible")
      .and("include.text", "app.email")
      .within(() => {
        cy.get("#local-email")
          .should("have.value", "")
          .type("john.doe@domain.tld");
      });

    cy.get('[data-test="password-field"]')
      .should("be.visible")
      .and("include.text", "auth.password")
      .within(() => {
        cy.get("#local-password").should("have.value", "").type("password");
      });

    // Check that forgot password link is hidden because password change is not allowed
    cy.get('[data-test="forgot-password-button"]').should("not.exist");

    // Intercept requests that will be needed to show the room index page (needed to check redirect)
    cy.intercept("GET", "api/v1/currentUser", {
      fixture: "currentUser.json",
    });
    cy.interceptRoomIndexRequests();

    cy.get('[data-test="login-button"]')
      .should("have.text", "auth.login")
      .click();

    // Check loading
    cy.get("#local-email").should("be.disabled");
    cy.get("#local-password").should("be.disabled");

    // Check if button is disabled after being clicked and loading and send response
    cy.get('[data-test="login-button"]')
      .should("be.disabled")
      .and("have.class", "p-button-loading")
      .then(() => {
        cy.wait("@cookieRequest");
        loginRequest.sendResponse();
      });

    // Check if correct data gets sent
    cy.wait("@loginRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        email: "john.doe@domain.tld",
        password: "password",
      });
      expect(interception.request.headers).to.contain({
        "x-xsrf-token": "test-csrf",
      });
    });

    // Check toast message
    cy.checkToastMessage("auth.flash.login");
    // Check if redirect works
    cy.url().should("include", "/rooms").and("not.include", "/login");
  });

  it("open forgot password page", function () {
    cy.fixture("config.json").then((config) => {
      config.data.auth.local = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.visit("/login");

    // Check if local login tab is shown correctly
    cy.get('[data-test="login-tab-button-local"]').click();
    cy.get("#local-email").should("be.visible").and("not.be.disabled");
    cy.get("#local-password").should("be.visible").and("not.be.disabled");

    cy.get('[data-test="login-button"]')
      .should("be.visible")
      .and("not.be.disabled");

    // Check that forgot password link is shown
    cy.get('[data-test="forgot-password-button"]')
      .should("be.visible")
      .and("not.be.disabled")
      .and("have.text", "auth.forgot_password")
      .click();

    cy.url().should("include", "/forgot_password").and("not.include", "/login");
  });

  it("hide local login if disabled", function () {
    cy.fixture("config.json").then((config) => {
      config.data.auth.local = false;
      config.data.auth.ldap = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      }).as("configRequest");
    });

    cy.visit("/login");

    cy.wait("@configRequest");

    cy.get('[data-test="login-tab-button-ldap"]').should("exist");
    cy.get('[data-test="login-tab-button-local"]').should("not.exist");
  });

  it("local login with redirect query set", function () {
    // Intercept config request to only show local login tab
    cy.fixture("config.json").then((config) => {
      config.data.auth.local = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    // Intercept login request
    cy.intercept("POST", "api/v1/login/local", {
      statusCode: 200,
    }).as("loginRequest");

    // Visit page that can only be visited by logged in users
    cy.visit("/admin");

    // Check redirect to the login page
    cy.url().should("include", "/login?redirect=/admin");

    // Intercept user request (user that has the permission to show the config page)
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    // Log in the user
    cy.get('[data-test="login-tab-button-local"]').click();
    cy.get("#local-email").type("john.doe@domain.tld");
    cy.get("#local-password").type("password");
    cy.get('[data-test="login-button"]').click();

    cy.wait("@loginRequest");
    // Check toast message
    cy.checkToastMessage("auth.flash.login");

    // Check if redirect works
    cy.url().should("include", "/admin").and("not.include", "/login");
  });

  it("local login errors", function () {
    // Intercept config request to only show local login tab
    cy.fixture("config.json").then((config) => {
      config.data.auth.local = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    // Unprocessable entity error
    cy.intercept("POST", "api/v1/login/local", {
      statusCode: 422,
      body: {
        message: "Password or Email wrong!",
        errors: {
          email: ["Password or Email wrong!"],
        },
      },
    }).as("loginRequest");

    cy.visit("/login");

    cy.get('[data-test="login-tab-button-local"]').click();
    cy.get("#local-email").type("john.doe@domain.tld");
    cy.get("#local-password").type("password");
    cy.get('[data-test="login-button"]').click();

    cy.wait("@loginRequest");

    // Check if error gets displayed
    cy.get('[data-test="email-field"]')
      .should("be.visible")
      .and("include.text", "Password or Email wrong!");

    // Check email field is marked as invalid
    cy.get("#local-email").should("have.attr", "aria-invalid", "true");

    // Check with different 422 error
    cy.intercept("POST", "api/v1/login/local", {
      statusCode: 422,
      body: {
        message: "The Password field is required",
        errors: {
          password: ["The Password field is required."],
        },
      },
    }).as("loginRequest");

    cy.get('[data-test="login-button"]').click();

    cy.wait("@loginRequest");

    // Check that previous error message is hidden
    cy.get('[data-test="email-field"]')
      .should("be.visible")
      .and("not.include.text", "Password or Email wrong!");

    // Check email field invalid state is removed
    cy.get("#local-email").should("not.have.attr", "aria-invalid");

    // Check if error gets displayed
    cy.get('[data-test="password-field"]')
      .should("be.visible")
      .and("include.text", "The Password field is required.");

    // Check password field is marked as invalid
    cy.get("#local-password").should("have.attr", "aria-invalid", "true");

    // Error for to many login requests gets displayed
    cy.intercept("POST", "api/v1/login/local", {
      statusCode: 429,
      headers: {
        "Retry-After": "59",
      },
      body: {
        message: "Too Many Attempts.",
      },
    }).as("loginRequest");

    cy.get('[data-test="login-button"]').click();

    cy.wait("@loginRequest");

    // Check if error gets displayed
    cy.contains('auth.throttle_{"seconds":"59"}').should("be.visible");
    // Check that 422 error messages are hidden
    cy.contains("Password or Email wrong!").should("not.exist");
    cy.contains("The Password field is required.").should("not.exist");

    // Check password field invalid state is removed
    cy.get("#local-password").should("not.have.attr", "aria-invalid");

    // Other api errors
    cy.intercept("POST", "api/v1/login/local", {
      statusCode: 500,
    }).as("loginRequest");

    cy.get('[data-test="login-button"]').click();

    cy.wait("@loginRequest");

    // Check that other error messages are hidden
    cy.contains('auth.throttle_{"seconds":"59"}').should("not.exist");

    // Check that error message is shown
    cy.checkToastMessage([
      "app.flash.server_error.empty_message",
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Intercept login request with different error
    cy.intercept("POST", "api/v1/login/local", {
      statusCode: 420,
    }).as("loginRequest");

    cy.get('[data-test="login-button"]').click();

    cy.wait("@loginRequest");

    cy.checkToastMessage("app.flash.guests_only");
    cy.url().should("not.include", "/login");
  });

  it("ldap login errors", function () {
    // Intercept config request to only show ldap login tab
    cy.fixture("config.json").then((config) => {
      config.data.auth.ldap = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });
    // Intercept csrf-cookie request to set defined cookie that can be checked later
    cy.intercept("GET", "/sanctum/csrf-cookie", {
      statusCode: 200,
      headers: {
        "Set-Cookie": "XSRF-TOKEN=test-csrf; Path=/",
      },
    }).as("cookieRequest");

    // Unprocessable entity error
    cy.intercept("POST", "api/v1/login/ldap", {
      statusCode: 422,
      body: {
        message: "These credentials do not match our records.",
        errors: {
          username: ["These credentials do not match our records."],
        },
      },
    }).as("loginRequest");

    cy.visit("/login");

    cy.get('[data-test="login-tab-button-ldap"]').click();
    cy.get("#ldap-username").type("user");
    cy.get("#ldap-password").type("password");
    cy.get('[data-test="login-button"]').click();

    cy.wait("@loginRequest");

    // Check if error gets displayed
    cy.get('[data-test="username-field"]')
      .should("be.visible")
      .and("include.text", "These credentials do not match our records.");

    // Check username field is marked as invalid
    cy.get("#ldap-username").should("have.attr", "aria-invalid", "true");

    // Check with different error
    cy.intercept("POST", "api/v1/login/ldap", {
      statusCode: 422,
      body: {
        message: "The Password field is required",
        errors: {
          password: ["The Password field is required."],
        },
      },
    }).as("loginRequest");

    cy.get('[data-test="login-button"]').click();

    cy.wait("@loginRequest");

    // Check that previous error message is hidden
    cy.get('[data-test="username-field"]')
      .should("be.visible")
      .and("not.include.text", "These credentials do not match our records.");

    // Check username field invalid state is removed
    cy.get("#ldap-username").should("not.have.attr", "aria-invalid");

    // Check if error gets displayed
    cy.get('[data-test="password-field"]')
      .should("be.visible")
      .and("include.text", "The Password field is required.");

    // Check password field is marked as invalid
    cy.get("#ldap-password").should("have.attr", "aria-invalid", "true");

    // Error for to many login requests gets displayed
    cy.intercept("POST", "api/v1/login/ldap", {
      statusCode: 429,
      headers: {
        "Retry-After": "59",
      },
      body: {
        message: "Too Many Attempts.",
      },
    }).as("loginRequest");

    cy.get('[data-test="login-button"]').click();

    cy.wait("@loginRequest");

    // Check if error gets displayed
    cy.contains('auth.throttle_{"seconds":"59"}').should("be.visible");
    // Check that 422 error messages are hidden
    cy.contains("These credentials do not match our records.").should(
      "not.exist",
    );
    cy.contains("The Password field is required.").should("not.exist");

    // Check password field invalid state is removed
    cy.get("#ldap-password").should("not.have.attr", "aria-invalid");

    // Other api errors
    cy.intercept("POST", "api/v1/login/ldap", {
      statusCode: 500,
    }).as("loginRequest");

    cy.get('[data-test="login-button"]').click();

    cy.wait("@loginRequest");

    // Check that other error messages are hidden
    cy.contains('auth.throttle_{"seconds":"59"}').should("not.exist");

    // Check that error message is shown
    cy.checkToastMessage([
      "app.flash.server_error.empty_message",
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Intercept login request with different error
    cy.intercept("POST", "api/v1/login/ldap", {
      statusCode: 420,
    }).as("loginRequest");

    cy.get('[data-test="login-button"]').click();
    cy.wait("@loginRequest");

    cy.checkToastMessage("app.flash.guests_only");
    cy.url().should("not.include", "/login");
  });

  it("visit login page with already logged in user", function () {
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
    cy.interceptRoomIndexRequests();

    // Check without redirect query parameter
    cy.visit("/login");
    cy.url().should("include", "/rooms").and("not.include", "/login");

    // Check with redirect query parameter
    cy.visit("/login?redirect=/admin");
    cy.url().should("include", "/admin").and("not.include", "/login");
  });

  it("shibboleth login", function () {
    // Intercept config request to only show local login tab
    cy.fixture("config.json").then((config) => {
      config.data.auth.shibboleth = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.visit("/login");

    cy.get('[data-test="login-tab-button-shibboleth"]').click();
    cy.get('[data-test="login-button"]')
      .should("include.text", "auth.shibboleth.redirect")
      .and("have.attr", "href", "/auth/shibboleth/redirect");

    // Intercept requests that will be needed to show the room index page (needed to check redirect)
    cy.intercept("/api/v1/currentUser", { fixture: "currentUser.json" });
    cy.interceptRoomIndexRequests();

    // Visit redirect page after external login
    cy.visit("/external_login");

    cy.url().should("include", "/rooms").and("not.include", "/login");
    cy.checkToastMessage("auth.flash.login");
  });

  it("hide shibboleth login if disabled", function () {
    // Intercept config request to only show local login tab
    cy.fixture("config.json").then((config) => {
      config.data.auth.local = true;
      config.data.auth.shibboleth = false;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      }).as("configRequest");
    });

    cy.visit("/login");

    cy.wait("@configRequest");
    cy.get('[data-test="login-tab-button-local"]').should("exist");
    cy.get('[data-test="login-tab-button-shibboleth"]').should("not.exist");
  });

  it("shibboleth login with redirect query set", function () {
    // Intercept config request to only show ldap login tab
    cy.fixture("config.json").then((config) => {
      config.data.auth.shibboleth = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    // Visit page that can only be visited by logged in users
    cy.visit("/admin");

    // Check redirect to the login page
    cy.url().should("include", "/login?redirect=/admin");

    cy.get('[data-test="login-tab-button-shibboleth"]').click();
    cy.get('[data-test="login-button"]')
      .should("include.text", "auth.shibboleth.redirect")
      .and("have.attr", "href", "/auth/shibboleth/redirect?redirect=%2Fadmin");

    // Intercept user request (user that has the permission to show the config page)
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    // Visit redirect page after external login (redirect query is set)
    cy.visit("/external_login?redirect=/admin");

    // Check if redirect works
    cy.url().should("include", "/admin").and("not.include", "/login");

    // Check admin page is shown (loading is finished) and toast message is shown
    cy.contains("admin.title").should("be.visible");
    cy.checkToastMessage("auth.flash.login");
  });

  it("external login callback missing attributes error", function () {
    // Visit redirect page after external login with error (missing attributes)
    cy.visit("/external_login?error=missing_attributes");

    // Check if error gets displayed
    cy.contains("auth.error.login_failed").should("be.visible");
    cy.contains("auth.error.missing_attributes").should("be.visible");

    // Check login button
    cy.get('a[data-test="login-button"]')
      .should("be.visible")
      .should("have.text", "auth.login")
      .should("have.attr", "href", "/login");
  });

  it("external login callback duplicate session error", function () {
    // Visit redirect page after external login with error (duplicate session)
    cy.visit("/external_login?error=shibboleth_session_duplicate_exception");

    // Check if error gets displayed
    cy.contains("auth.error.login_failed").should("be.visible");
    cy.contains("auth.error.shibboleth_session_duplicate_exception").should(
      "be.visible",
    );

    // Check login button
    cy.get('a[data-test="login-button"]')
      .should("be.visible")
      .should("have.text", "auth.login")
      .should("have.attr", "href", "/login");
  });

  it("external login callback invalid request", function () {
    // Visit redirect page after external login with error (invalid request)
    cy.visit("/external_login?error=invalid_request");

    // Check if error gets displayed
    cy.contains("auth.error.login_failed").should("be.visible");
    cy.contains("auth.error.invalid_request").should("be.visible");

    // Check login button
    cy.get('a[data-test="login-button"]')
      .should("be.visible")
      .should("have.text", "auth.login")
      .should("have.attr", "href", "/login");
  });

  it("external login callback openid connect network exception", function () {
    // Visit redirect page after external login with error (openid connect network exception)
    cy.visit("/external_login?error=openid_connect_network_exception");

    // Check if error gets displayed
    cy.contains("auth.error.login_failed").should("be.visible");
    cy.contains("auth.error.openid_connect_network_exception").should(
      "be.visible",
    );

    // Check login button
    cy.get('a[data-test="login-button"]')
      .should("be.visible")
      .should("have.text", "auth.login")
      .should("have.attr", "href", "/login");
  });

  it("external login callback openid connect exception", function () {
    // Visit redirect page after external login with error (openid connect exception)
    cy.visit("/external_login?error=openid_connect_exception");

    // Check if error gets displayed
    cy.contains("auth.error.login_failed").should("be.visible");
    cy.contains("auth.error.openid_connect_exception").should("be.visible");

    // Check login button
    cy.get('a[data-test="login-button"]')
      .should("be.visible")
      .should("have.text", "auth.login")
      .should("have.attr", "href", "/login");
  });

  it("external login callback with error and already logged in user", function () {
    cy.intercept("/api/v1/currentUser", { fixture: "currentUser.json" });
    cy.interceptRoomIndexRequests();

    // Visit redirect page after external login with error
    cy.visit("/external_login?error=invalid_request");

    // Check redirected to room overview page
    cy.url().should("include", "/rooms").and("not.include", "/login");
  });

  it("oidc login", function () {
    // Intercept config request to only show oidc login tab
    cy.fixture("config.json").then((config) => {
      config.data.auth.oidc = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.visit("/login");

    cy.get('[data-test="login-tab-button-oidc"]').click();

    cy.get('[data-test="login-button"]')
      .should("include.text", "auth.oidc.redirect")
      .and("have.attr", "href", "/auth/oidc/redirect");

    // Intercept requests that will be needed to show the room index page (needed to check redirect)
    cy.intercept("/api/v1/currentUser", { fixture: "currentUser.json" });
    cy.interceptRoomIndexRequests();

    // Visit redirect page after external login
    cy.visit("/external_login");

    cy.url().should("include", "/rooms").and("not.include", "/login");
    cy.checkToastMessage("auth.flash.login");
  });

  it("hide oidc login if disabled", function () {
    // Intercept config request to only show local login tab
    cy.fixture("config.json").then((config) => {
      config.data.auth.local = true;
      config.data.auth.oidc = false;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      }).as("configRequest");
    });

    cy.visit("/login");

    cy.wait("@configRequest");
    cy.get('[data-test="login-tab-button-local"]').should("exist");
    cy.get('[data-test="login-tab-button-oidc"]').should("not.exist");
  });

  it("oidc login with redirect query set", function () {
    // Intercept config request to only show oidc login tab
    cy.fixture("config.json").then((config) => {
      config.data.auth.oidc = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    // Visit page that can only be visited by logged in users
    cy.visit("/admin");

    // Check redirect to the login page
    cy.url().should("include", "/login?redirect=/admin");

    cy.get('[data-test="login-tab-button-oidc"]').click();

    cy.get('[data-test="login-button"]')
      .should("include.text", "auth.oidc.redirect")
      .and("have.attr", "href", "/auth/oidc/redirect?redirect=%2Fadmin");

    // Intercept user request (user that has the permission to show the config page)
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    // Visit redirect page after external login (redirect query is set)
    cy.visit("/external_login?redirect=/admin");

    // Check if redirect works
    cy.url().should("include", "/admin").and("not.include", "/login");

    // Check admin page is shown (loading is finished) and toast message is shown
    cy.contains("admin.title").should("be.visible");
    cy.checkToastMessage("auth.flash.login");
  });

  it("external login with redirect query and no_message set", function () {
    // Intercept user request (user that has the permission to show the config page)
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = ["admin.view"];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });

    // Visit redirect page after external login (redirect query is set)
    cy.visit("/external_login?no_message=1&redirect=/admin");

    // Check if redirect works
    cy.url().should("include", "/admin").and("not.include", "/login");

    // Check admin page is shown (loading is finished) and no toast message is shown
    cy.contains("admin.title").should("be.visible");
    cy.get(".p-toast-message").should("not.exist");
  });
});
