// Smoke tests — every public page loads and shows its real current content.
// Rewritten 2026-09-11: the previous version tested a hero-tiles/telemetry-dashboard
// homepage from an earlier redesign (stats like "2400+", "99.99%", routes like
// /work, /architecture, /war-room) that no longer exists on the current
// minimal, content-first site. These assertions match what's actually in
// src/app/**/page.tsx today.

describe('Smoke — page load + content', () => {
  it('homepage: shows name, role, and the current-work note', () => {
    cy.visit('/');
    cy.get('h1').should('contain.text', 'Luis Gimenez');
    cy.contains('Site Reliability Engineer').should('exist');
    cy.contains('The Home Depot').should('exist');
    cy.contains('2,300+ store rollout').should('exist');
  });

  it('about page loads', () => {
    cy.visit('/about');
    cy.get('h1').should('contain.text', 'About');
  });

  it('writing page loads', () => {
    cy.visit('/writing');
    cy.get('h1').should('contain.text', 'Writing');
  });

  it('contact page loads with the open-to-roles note', () => {
    cy.visit('/contact');
    cy.get('h1').should('contain.text', 'Contact');
    cy.contains('Open to Senior SRE roles').should('exist');
  });

  it('chat page loads the AI assistant', () => {
    cy.visit('/chat');
    cy.get('h1').should('contain.text', 'Ask the AI Assistant');
  });
});
