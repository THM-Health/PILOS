describe('Login', () => {

  beforeEach(()=>{
    cy.intercept('GET', 'api/v1/locale/en', {});
  });

  it('correct data gets sent in ldap login', () => {
    cy.intercept('/sanctum/csrf-cookie', {
      statusCode: 200
    }).as('cookieRequest');
    cy.intercept('api/v1/login/ldap',{
      statusCode: 200
    }).as('loginRequest');

    cy.visit('/login');

    cy.get('[data-cy="login-tab-ldap"]').within(()=>{ //ToDo think about giving components data-cy or something similar (easier to test)
      cy.get('#ldap-username').type('user');
      cy.get('#ldap-password').type('password');
      cy.setCookie('XSRF-TOKEN', 'test-csrf');
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
          "local": true,
          "ldap": false,
          "shibboleth": false
        }
      }
    })
    cy.visit('/login');
    cy.get('[data-cy="login-tab-ldap"]').should('not.exist');
  });

  it('correct data gets sent on email login', () =>{
    cy.intercept('/sanctum/csrf-cookie', {
      statusCode: 200
    }).as('cookieRequest');
    cy.intercept('api/v1/login/local',{
      statusCode: 200
    }).as('loginRequest');

    cy.visit('/login');

    cy.get('#pv_id_5_1_header_action').click(); //ToDo think about changing settings so only local login is shown

    cy.get('[data-cy="login-tab-local"]').within(()=>{ //ToDo think about giving components data-cy or something similar (easier to test)
      cy.get('#local-email').type('user');
      cy.get('#local-password').type('password');
      cy.setCookie('XSRF-TOKEN', 'test-csrf');
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
