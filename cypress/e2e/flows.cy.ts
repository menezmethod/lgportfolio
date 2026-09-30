// Flows: critical navigation, against the current site.
// The header (src/components/site/SiteHeader.tsx) links Work, Systems, About, GitHub, Resume, Contact.

describe('Flows: navigation', () => {
  it('header nav links land on the right page', () => {
    const cases: Array<{ href: string; heading: string }> = [
      { href: '/work', heading: 'Things I built' },
      { href: '/about', heading: 'Software engineer' },
      { href: '/contact', heading: 'Open to Senior Platform' },
    ];

    cases.forEach(({ href, heading }) => {
      cy.visit('/');
      cy.get(`header a[href="${href}"]`).first().click();
      cy.url().should('include', href);
      cy.get('h1').should('contain.text', heading);
    });
  });

  it('prompt bar sends a question to the chat prefilled', () => {
    cy.visit('/');
    cy.get('#ask').type('hello{enter}');
    cy.url().should('include', '/chat?q=hello');
    cy.get('[data-cy="chat-input"]').should('have.value', 'hello');
  });

  it('homepage case-study links open real pages', () => {
    cy.visit('/');
    cy.contains('a', 'Open case study').first().click();
    cy.url().should('include', '/work/');
    cy.get('h1').should('exist');
  });
});
