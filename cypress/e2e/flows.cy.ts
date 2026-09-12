// Flows — critical navigation, against the current site.
// Rewritten 2026-09-11: the previous version clicked nav buttons
// (data-slot="button") and routes (/work, /architecture, /war-room) from an
// earlier redesign. The current layout uses plain text links in the header
// nav (Writing, About, Contact) and a homepage link list; the "AI Chat"
// button in the navbar is the one real data-slot="button" left in the app.

describe('Flows — navigation', () => {
  it('header nav links land on the right page', () => {
    const cases: Array<{ href: string; heading: string }> = [
      { href: '/writing', heading: 'Writing' },
      { href: '/about', heading: 'About' },
      { href: '/contact', heading: 'Contact' },
    ];

    cases.forEach(({ href, heading }) => {
      cy.visit('/');
      cy.get(`a[href="${href}"]`).first().click();
      cy.url().should('include', href);
      cy.get('h1').should('contain.text', heading);
    });
  });

  it('homepage link list reaches About and Contact directly', () => {
    cy.visit('/');
    cy.contains('a', 'About / Experience').should('have.attr', 'href', '/about');
    cy.contains('a', 'Contact').should('have.attr', 'href', '/contact');
  });

  it('the AI Chat nav button opens the chat page', () => {
    cy.visit('/');
    cy.get('a[data-cy="nav-chat"]').first().click({ force: true });
    cy.url().should('include', '/chat');
    cy.get('h1').should('contain.text', 'Ask the AI Assistant');
  });
});
