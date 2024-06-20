describe('Login', function () {
  beforeEach(function () {
    cy.seed();
  });

  it('local login', function () {
    cy.visit('/login');

    // Check if ldap login tab is shown correctly and click on login button
    cy.get('[data-test="login-tab-local"]').within(() => {
      cy.get('#local-email').type('john.doe@example.org');
      cy.get('#local-password').type('johndoe');

      cy.get('.p-button').should('contain', 'Login').click();
    });

    // Check toast message
    cy.get('.p-toast').should('be.visible').and('contain', 'Successfully logged in');
    // Check if redirect works
    cy.url().should('contain', '/rooms').and('not.contain', '/login');
  });

  it('local login invalid', function () {
    cy.visit('/login');

    // Check if ldap login tab is shown correctly and click on login button
    cy.get('[data-test="login-tab-local"]').within(() => {
      cy.get('#local-email').type('john.doe@example.org');
      cy.get('#local-password').type('johndoe2');

      cy.get('.p-button').should('contain', 'Login').click();
    });

    // Check error message
    cy.contains('These credentials do not match our records.');
  });
});
