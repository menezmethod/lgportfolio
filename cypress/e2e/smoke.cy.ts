// Smoke tests: every public page loads and shows its real current content.
// Updated for the editorial redesign (home, /work, /work/[slug], /about, /contact, /chat, /war-room).
// Assertions use stable facts, not exact prose.

describe('Smoke: page load + content', () => {
  it('homepage: shows name, the headline, and the case studies', () => {
    cy.visit('/');
    cy.get('h1').should('contain.text', 'Luis Gimenez');
    cy.contains('I build and run systems that have to keep working').should('exist');
    cy.contains('The Home Depot').should('exist');
    cy.contains('Open to Senior Platform, Infrastructure, and Go backend roles').should('exist');
    cy.get('#systems').should('exist');
    cy.contains('Open case study').should('exist');
  });

  it('work page lists case studies and a case study opens', () => {
    cy.visit('/work');
    cy.get('h1').should('contain.text', 'Things I built');
    cy.visit('/work/deployment-path');
    cy.get('h1').should('contain.text', 'Deployment path');
  });

  it('about page loads', () => {
    cy.visit('/about');
    cy.get('h1').should('contain.text', 'Software engineer');
  });

  it('contact page loads with the open-to-roles note', () => {
    cy.visit('/contact');
    cy.get('h1').should('contain.text', 'Open to Senior Platform, Infrastructure, and Go backend roles');
  });

  it('chat page loads the assistant', () => {
    cy.visit('/chat');
    cy.get('h1').should('contain.text', 'Ask the assistant');
    cy.get('[data-cy="chat-input"]').should('exist');
  });

  it('war room page loads', () => {
    cy.visit('/war-room');
    cy.get('h1').should('contain.text', 'Telemetry from this site');
  });
});
