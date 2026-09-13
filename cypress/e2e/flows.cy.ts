// Flows: critical navigation, against the current site.
// Rewritten 2026-09-11: the previous version clicked nav buttons
// (data-slot="button") and routes (/work, /architecture, /war-room) from an
// earlier redesign. The current live nav (src/app/layout.tsx) is a plain
// text-link header: About, Contact. A separate Navbar.tsx component
// existed with an "AI Chat" nav button and data-cy hooks, but it was dead
// code (never imported by any page), so it's deleted rather than tested.
// /chat is still a real route, just not linked from the header nav today.
// The /writing section (blog) was removed 2026-09-13.

describe('Flows: navigation', () => {
  it('header nav links land on the right page', () => {
    const cases: Array<{ href: string; heading: string }> = [
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
});
