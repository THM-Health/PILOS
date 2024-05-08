describe('Login', () => {

  beforeEach(()=>{
    cy.intercept('GET', 'api/v1/locale/en', {});
  });

  it('correct data gets sent in ldap login', () => {
    cy.intercept('api/v1/settings', { //ToDo meta?? or error not important???
      "data": {
        "auth": {
          "ldap": true
        }
      }
    })
    cy.intercept('/sanctum/csrf-cookie', {
      statusCode: 200,
      headers: {
        'Set-Cookie': 'XSRF-TOKEN=test-csrf; Path=/'
      }
    }).as('cookieRequest');
    cy.intercept('api/v1/login/ldap',{
      statusCode: 200
    }).as('loginRequest');

    cy.visit('/login');

    cy.get('[data-test="login-tab-ldap"]').within(()=>{
      cy.get('#ldap-username').type('user');
      cy.get('#ldap-password').type('password');
      cy.get('.p-button').click();
    });

    cy.wait('@loginRequest').then(interception =>{
      expect(interception.request.body).to.contain({
        username: 'user',
        password: 'password'
      });
      expect(interception.request.headers).to.contain({
        'x-xsrf-token': 'test-csrf'
      })
    })
  });

  it('hide ldap login if disabled', () =>{
    cy.intercept('api/v1/settings', {
      "data": {
        "auth": {
          "local": true
        }
      }
    })
    cy.visit('/login');
    cy.get('[data-test="login-tab-ldap"]').should('not.exist');
  });

  it('correct data gets sent on email login', () =>{
    cy.intercept('api/v1/settings', {
      "data": {
        "auth": {
          "local": true
        }
      }
    });
    cy.intercept('/sanctum/csrf-cookie', {
      statusCode: 200,
      headers: {
        'Set-Cookie': 'XSRF-TOKEN=test-csrf; Path=/'
      }
    }).as('cookieRequest');
    cy.intercept('api/v1/login/local',{
      statusCode: 200
    }).as('loginRequest');

    cy.visit('/login');

    cy.get('[data-test="login-tab-local"]').within(()=>{
      cy.get('#local-email').type('user');
      cy.get('#local-password').type('password');
      cy.get('.p-button').click();
    });

    cy.wait('@loginRequest').then(interception =>{
      expect(interception.request.body).to.contain({
        email: 'user',
        password: 'password'
      });
      expect(interception.request.headers).to.contain({
        'x-xsrf-token': 'test-csrf'
      })
    })
  })

  //ToDo
})
