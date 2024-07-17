import { interceptIndefinitely } from '../support/utils/interceptIndefinitely.js';
import env from '../../../resources/js/env.js';

describe('Login', function () {
  beforeEach(function () {
    cy.intercept('GET', 'api/v1/locale/en', {});
  });

  it('ldap login', function () {
    // Intercept config request to only show ldap login tab
    cy.intercept('GET', 'api/v1/config', {
      data: {
        general: { toast_lifetime: 0 },
        theme: { primary_color: '#14b8a6', rounded: true },
        auth: {
          ldap: true
        }
      }
    });
    // Intercept csrf-cookie request to set defined cookie that can be checked later
    cy.intercept('GET', '/sanctum/csrf-cookie', {
      statusCode: 200,
      headers: {
        'Set-Cookie': 'XSRF-TOKEN=test-csrf; Path=/'
      }
    }).as('cookieRequest');

    // Intercept login request
    const loginRequest = interceptIndefinitely('POST', 'api/v1/login/ldap', {
      statusCode: 200
    }, 'loginRequest');

    cy.visit('/login');

    // Check if ldap login tab is shown correctly and click on login button
    cy.get('[data-test="login-tab-ldap"]').within(() => {
      cy.get('#ldap-username').type('user');
      cy.get('#ldap-password').type('password');

      // Intercept requests that will be needed to show the room index page (needed to check redirect)
      cy.intercept('GET', 'api/v1/currentUser', { fixture: 'exampleUser.json' });
      cy.interceptRoomIndexRequests();

      cy.get('button').should('have.text', 'auth.login').click();
      // Check if button is disabled after being clicked and loading and send response
      cy.get('button').should('be.disabled').and('have.class', 'p-button-loading').then(() => {
        cy.wait('@cookieRequest');
        loginRequest.sendResponse();
      });
    });

    // Check if correct data gets sent
    cy.wait('@loginRequest').then(interception => {
      expect(interception.request.body).to.contain({
        username: 'user',
        password: 'password'
      });
      expect(interception.request.headers).to.contain({
        'x-xsrf-token': 'test-csrf'
      });
    });

    // Check toast message
    cy.get('.p-toast').should('be.visible').and('have.text', 'auth.flash.login');
    // Check if redirect works
    cy.url().should('include', '/rooms').and('not.include', '/login');
  });

  it('hide ldap login if disabled', function () {
    // Intercept config request to only show ldap login tab
    cy.intercept('GET', 'api/v1/config', {
      data: {
        general: { toast_lifetime: 0 },
        theme: { primary_color: '#14b8a6', rounded: true },
        auth: {
          ldap: false
        }
      }
    });

    cy.visit('/login');
    cy.get('[data-test="login-tab-ldap"]').should('not.exist');
  });

  it('ldap login with redirect query set', function () {
    // Intercept config request to only show ldap login tab
    cy.intercept('GET', 'api/v1/config', {
      data: {
        general: { toast_lifetime: 0 },
        theme: { primary_color: '#14b8a6', rounded: true },
        auth: {
          ldap: true
        }
      }
    });

    // Intercept login request
    cy.intercept('POST', 'api/v1/login/ldap', {
      statusCode: 200
    }).as('loginRequest');

    // Visit page that can only be visited by logged in users
    cy.visit('admin');

    // Check redirect to the login page
    cy.url().should('include', '/login?redirect=/admin');

    // Intercept user request (user that has the permission to show the config page)
    cy.intercept('GET', 'api/v1/currentUser', {
      data: {
        id: 1,
        firstname: 'John',
        lastname: 'Doe',
        locale: 'en',
        permissions: ['admin.view'],
        model_name: 'User',
        room_limit: -1
      }
    });

    // Log in the user
    cy.get('[data-test="login-tab-ldap"]').within(() => {
      cy.get('#ldap-username').type('user');
      cy.get('#ldap-password').type('password');
      cy.get('button').click();
    });

    cy.wait('@loginRequest');

    // Check toast message
    cy.get('.p-toast').should('be.visible').and('have.text', 'auth.flash.login');

    // Check if redirect works
    cy.url().should('include', '/admin').and('not.include', '/login');
  });

  it('local login', function () {
    // Intercept config request to only show local login tab
    cy.intercept('GET', 'api/v1/config', {
      data: {
        general: { toast_lifetime: 0 },
        theme: { primary_color: '#14b8a6', rounded: true },
        auth: {
          local: true
        }
      }
    });
    // Intercept csrf-cookie request to set defined cookie that can be checked later
    cy.intercept('GET', '/sanctum/csrf-cookie', {
      statusCode: 200,
      headers: {
        'Set-Cookie': 'XSRF-TOKEN=test-csrf; Path=/'
      }
    }).as('cookieRequest');

    // Intercept login request
    const loginRequest = interceptIndefinitely('POST', 'api/v1/login/local', {
      statusCode: 200
    }, 'loginRequest');

    cy.visit('/login');

    // Check if ldap login tab is shown correctly and click on login button
    cy.get('[data-test="login-tab-local"]').within(() => {
      cy.get('#local-email').type('john.doe@domain.tld');
      cy.get('#local-password').type('password');

      // Intercept requests that will be needed to show the room index page (needed to check redirect)
      cy.intercept('GET', 'api/v1/currentUser', { fixture: 'exampleUser.json' });
      cy.interceptRoomIndexRequests();

      cy.get('.p-button').should('have.text', 'auth.login').click();
      // Check if button is disabled after being clicked and loading and send response
      cy.get('.p-button').should('be.disabled').and('have.class', 'p-button-loading').then(() => {
        cy.wait('@cookieRequest');
        loginRequest.sendResponse();
      });
    });

    // Check if correct data gets sent
    cy.wait('@loginRequest').then(interception => {
      expect(interception.request.body).to.contain({
        email: 'john.doe@domain.tld',
        password: 'password'
      });
      expect(interception.request.headers).to.contain({
        'x-xsrf-token': 'test-csrf'
      });
    });

    // Check toast message
    cy.get('.p-toast').should('be.visible').and('have.text', 'auth.flash.login');
    // Check if redirect works
    cy.url().should('include', '/rooms').and('not.include', '/login');
  });

  it('hide local login if disabled', function () {
    cy.intercept('GET', 'api/v1/config', {
      data: {
        general: { toast_lifetime: 0 },
        theme: { primary_color: '#14b8a6', rounded: true },
        auth: {
          local: false
        }
      }
    });

    cy.visit('/login');
    cy.get('[data-test="login-tab-local"]').should('not.exist');
  });

  it('local login with redirect query set', function () {
    // Intercept config request to only show local login tab
    cy.intercept('GET', 'api/v1/config', {
      data: {
        general: { toast_lifetime: 0 },
        theme: { primary_color: '#14b8a6', rounded: true },
        auth: {
          local: true
        }
      }
    });

    // Intercept login request
    cy.intercept('POST', 'api/v1/login/local', {
      statusCode: 200
    }).as('loginRequest');

    // Visit page that can only be visited by logged in users
    cy.visit('admin');

    // Check redirect to the login page
    cy.url().should('include', '/login?redirect=/admin');

    // Intercept user request (user that has the permission to show the config page)
    cy.intercept('GET', 'api/v1/currentUser', {
      data: {
        id: 1,
        firstname: 'John',
        lastname: 'Doe',
        locale: 'en',
        permissions: ['admin.view'],
        model_name: 'User',
        room_limit: -1
      }
    });

    // Log in the user
    cy.get('[data-test="login-tab-local"]').within(() => {
      cy.get('#local-email').type('john.doe@domain.tld');
      cy.get('#local-password').type('password');
      cy.get('.p-button').click();
    });
    cy.wait('@loginRequest');
    // Check toast message
    cy.get('.p-toast').should('be.visible').and('have.text', 'auth.flash.login');

    // Check if redirect works
    cy.url().should('include', '/admin').and('not.include', '/login');
  });

  it('login errors', function () {
    // Intercept config request to only show local login tab
    cy.intercept('GET', 'api/v1/config', {
      data: {
        general: { toast_lifetime: 0 },
        theme: { primary_color: '#14b8a6', rounded: true },
        auth: {
          local: true
        }
      }
    });

    // Unprocessable entity error gets displayed

    // Intercept login request
    cy.intercept('POST', 'api/v1/login/local', {
      statusCode: env.HTTP_UNPROCESSABLE_ENTITY,
      body: {
        errors: {
          email: ['Password or Email wrong!']
        }
      }
    }).as('loginRequest');

    cy.visit('/login');

    // Try to log in the user
    cy.get('[data-test="login-tab-local"]').within(() => {
      cy.get('#local-email').type('john.doe@domain.tld');
      cy.get('#local-password').type('password');
      cy.get('.p-button').click();
    });

    cy.wait('@loginRequest');

    // Check if error gets displayed
    cy.contains('Password or Email wrong!').should('be.visible');

    // Error for to many login requests gets displayed

    // Intercept login request
    cy.intercept('POST', 'api/v1/login/local', {
      statusCode: env.HTTP_TOO_MANY_REQUESTS,
      body: {
        errors: {
          email: ['Too many logins. Please try again later!']
        }
      }
    }).as('loginRequest');

    // Try to log in the user
    cy.get('[data-test="login-tab-local"]').within(() => {
      cy.get('.p-button').click();
    });

    cy.wait('@loginRequest');

    // Check if error gets displayed
    cy.contains('Too many logins. Please try again later!').should('be.visible');
    cy.contains('Password or Email wrong!').should('not.exist');

    // Other api errors

    // Intercept login request
    cy.intercept('POST', 'api/v1/login/local', {
      statusCode: 500
    }).as('loginRequest');

    // Try to log in the user
    cy.get('[data-test="login-tab-local"]').within(() => {
      cy.get('.p-button').click();
    });

    cy.wait('@loginRequest');

    cy.contains('Too many logins. Please try again later!').should('not.exist');
    cy.contains('Password or Email wrong!').should('not.exist');

    cy.get('.p-toast').should('be.visible').and('include.text', 'app.flash.server_error.empty_message').find('button').click();

    // Intercept login request with different error
    cy.intercept('POST', 'api/v1/login/local', {
      statusCode: env.HTTP_GUESTS_ONLY
    }).as('loginRequest');

    cy.get('[data-test="login-tab-local"]').within(() => {
      cy.get('.p-button').click();
    });
    cy.wait('@loginRequest');

    cy.get('.p-toast').should('be.visible').and('have.text', 'app.flash.guests_only');
    cy.url().should('not.include', '/login');
  });

  it('visit login page with already logged in user', function () {
    cy.intercept('GET', 'api/v1/currentUser', { fixture: 'exampleUser.json' });

    cy.visit('/login');
    cy.get('.p-toast').should('be.visible').and('have.text', 'app.flash.guests_only');
    cy.url().should('not.include', '/login');
  });

  it('shibboleth login', function () {
    // Intercept config request to only show local login tab
    cy.intercept('GET', 'api/v1/config', {
      data: {
        general: { toast_lifetime: 0 },
        theme: { primary_color: '#14b8a6', rounded: true },
        auth: {
          shibboleth: true
        }
      }
    });

    cy.visit('/login');

    cy.get('[data-test="login-tab-external"]').within(() => {
      cy.get('.p-button').should('include.text', 'auth.shibboleth.redirect').and('have.attr', 'href', '/auth/shibboleth/redirect');
    });

    // Intercept requests that will be needed to show the room index page (needed to check redirect)
    cy.intercept('/api/v1/currentUser', { fixture: 'exampleUser.json' });
    cy.interceptRoomIndexRequests();

    // Visit redirect page after external login
    cy.visit('/external_login');

    cy.url().should('include', '/rooms').and('not.include', '/login');
  });

  it('hide shibboleth login if disabled', function () {
    // Intercept config request to only show local login tab
    cy.intercept('GET', 'api/v1/config', {
      data: {
        general: { toast_lifetime: 0 },
        theme: { primary_color: '#14b8a6', rounded: true },
        auth: {
          shibboleth: false
        }
      }
    });

    cy.visit('/login');
    cy.get('[data-test="login-tab-external"]').should('not.exist');
  });

  it('shibboleth login with redirect query set', function () {
    // Intercept config request to only show ldap login tab
    cy.intercept('GET', 'api/v1/config', {
      data: {
        general: { toast_lifetime: 0 },
        theme: { primary_color: '#14b8a6', rounded: true },
        auth: {
          shibboleth: true
        }
      }
    });

    // Visit page that can only be visited by logged in users
    cy.visit('admin');

    // Check redirect to the login page
    cy.url().should('include', '/login?redirect=/admin');

    cy.get('[data-test="login-tab-external"]').within(() => {
      cy.get('.p-button').should('include.text', 'auth.shibboleth.redirect').and('have.attr', 'href', '/auth/shibboleth/redirect?redirect=%2Fadmin');
    });

    // Intercept user request (user that has the permission to show the config page)
    cy.intercept('GET', 'api/v1/currentUser', {
      data: {
        id: 1,
        firstname: 'John',
        lastname: 'Doe',
        locale: 'en',
        permissions: ['admin.view'],
        model_name: 'User',
        room_limit: -1
      }
    });

    // Visit redirect page after external login (redirect query is set)
    cy.visit('/external_login?redirect=/admin');

    // Check if redirect works
    cy.url().should('include', '/admin').and('not.include', '/login');
  });

  it('shibboleth login callback missing attributes', function () {
    // Visit redirect page after external login with error (missing attributes)
    cy.visit('/external_login?error=missing_attributes');

    // Check if error gets displayed
    cy.contains('auth.error.login_failed').should('be.visible');
    cy.contains('auth.error.missing_attributes').should('be.visible');
  });

  it('shibboleth login callback duplicate session', function () {
    // Visit redirect page after external login with error (duplicate session)
    cy.visit('/external_login?error=shibboleth_session_duplicate_exception');

    // Check if error gets displayed
    cy.contains('auth.error.login_failed').should('be.visible');
    cy.contains('auth.error.shibboleth_session_duplicate_exception').should('be.visible');
  });
});
