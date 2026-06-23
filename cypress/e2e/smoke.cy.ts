// Smoke tests — every public page loads AND contains expected content.
// Selectors use `data-cy` per project convention. Generic `h1`/`body` checks
// are only used where asserting visible copy.

describe('Smoke — page load + content', () => {
  context('Homepage', () => {
    it('shows the hero headline and rotating SRE subtitle', () => {
      cy.visit('/');
      cy.contains('h1', /Reliability that/i).should('be.visible');
      // First card in the rotating titles list
      cy.contains('Site Reliability Engineering').should('exist');
      cy.contains('Luis Gimenez').should('exist');
    });

    it('renders the hero CTA links', () => {
      cy.visit('/');
      cy.contains('a', 'Get in Touch').should('have.attr', 'href', '/contact');
      cy.contains('a', 'View Architecture').should('have.attr', 'href', '/architecture');
      cy.contains('a', /AI Chat/).should('have.attr', 'href', '/chat');
    });

    it('renders the four hero telemetry tiles with their metrics', () => {
      cy.visit('/');
      cy.contains('2400+').should('exist');
      cy.contains('50+').should('exist');
      cy.contains('<50ms').should('exist');
      cy.contains('99.99%').should('exist');
    });
  });

  context('About', () => {
    it('renders headline, "What I Build" and "Operating Principles" sections', () => {
      cy.visit('/about');
      cy.contains('h1', 'Site Reliability Engineer.').should('be.visible');
      cy.contains('h2', 'What I Build').should('be.visible');
      cy.contains('h2', 'Operating Principles').should('be.visible');
      cy.contains('a', 'View full experience').should('have.attr', 'href', '/experience');
    });
  });

  context('Chat', () => {
    it('shows the chat header, intro assistant message, and input', () => {
      cy.visit('/chat');
      cy.contains('h1', 'Ask the AI Assistant').should('be.visible');
      cy.contains("I'm Luis's AI assistant").should('be.visible');
      // Selector tolerant of pre- and post-deploy attributes:
      //   data-cy  — added by this PR (preferred)
      //   data-testid — already on production (fallback)
      cy.get('[data-cy="chat-input"], [data-testid="chat-input"]').should('be.visible');
      cy.get('[data-cy="chat-send"], [data-testid="chat-send"]').should('exist');
    });
  });

  context('War Room', () => {
    it('renders the live telemetry header', () => {
      cy.visit('/war-room');
      cy.contains('h1', 'Live Infrastructure Telemetry').should('be.visible');
      cy.contains('LIVE').should('exist');
    });

    it('renders the observability stack linking to /api/health', () => {
      cy.visit('/war-room');
      cy.contains('Observability Stack').should('be.visible');
      cy.contains('a', 'Health API').should('have.attr', 'href', '/api/health');
    });
  });

  context('Work', () => {
    it('renders the hero and at least one featured project card', () => {
      cy.visit('/work');
      cy.contains('h1', /Systems with/i).should('be.visible');
      cy.contains('Featured systems').should('be.visible');
      cy.get('article').should('have.length.gte', 1);
    });
  });

  context('Experience', () => {
    it('renders the Home Depot entry', () => {
      cy.visit('/experience');
      cy.contains('The Home Depot').should('be.visible');
    });
  });

  context('Skills', () => {
    it('renders the technical skills heading', () => {
      cy.visit('/skills');
      cy.contains('Technical Skills').should('be.visible');
    });
  });

  context('Contact', () => {
    it('renders headline, resume request CTA, and the email social link', () => {
      cy.visit('/contact');
      cy.contains('h1', /Get In Touch/i).should('be.visible');
      cy.contains('a', 'Request Resume')
        .should('have.attr', 'href')
        .and('include', 'mailto:luisgimenezdev@gmail.com');
      cy.contains('a', 'luisgimenezdev@gmail.com').should('exist');
    });
  });
});