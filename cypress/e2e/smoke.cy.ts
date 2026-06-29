// Smoke tests — every public page loads AND contains expected content.
// Selectors use actual production DOM: nav buttons with href, data-testid for chat, text content.

describe('Smoke — page load + content', () => {
  // Wait for hydration to complete by checking for non-loading content
  const waitForHydration = () => {
    cy.get('body', { timeout: 30000 }).should('not.contain', 'booting...');
  };

  context('Homepage', () => {
    beforeEach(() => {
      cy.visit('/', { timeout: 30000 });
      waitForHydration();
    });

    it('shows the hero headline and rotating SRE subtitle', () => {
      cy.contains('h1', /Reliability that/i).should('be.visible');
      cy.contains('Site Reliability Engineering').should('exist');
      cy.contains('Luis Gimenez').should('exist');
    });

    it('renders the hero CTA links', () => {
      // Nav buttons are <a> with data-slot="button" and href
      cy.get('a[data-slot="button"][href="/contact"]').should('exist');
      cy.get('a[data-slot="button"][href="/architecture"]').should('exist');
      cy.get('a[data-slot="button"][href="/chat"]').should('exist');
    });

    it('renders the four hero telemetry tiles with their metrics', () => {
      cy.contains('2400+').should('exist');
      cy.contains('50+').should('exist');
      cy.contains('<50ms').should('exist');
      cy.contains('99.99%').should('exist');
    });
  });

  context('About', () => {
    beforeEach(() => {
      cy.visit('/about', { timeout: 30000 });
      waitForHydration();
    });

    it('renders headline, "What I Build" and "Operating Principles" sections', () => {
      cy.contains('h1', 'Site Reliability Engineer.').should('be.visible');
      cy.contains('h2', 'What I Build').should('be.visible');
      cy.contains('h2', 'Operating Principles').should('be.visible');
      cy.contains('a', 'View full experience').should('have.attr', 'href', '/experience');
    });
  });

  context('Chat', () => {
    beforeEach(() => {
      cy.visit('/chat', { timeout: 30000 });
      waitForHydration();
    });

    it('shows the chat header, intro assistant message, and input', () => {
      cy.contains('h1', "Ask the AI Assistant").should('be.visible');
      cy.contains("I'm Luis's AI assistant").should('be.visible');
      // Production uses data-testid, not data-cy
      cy.get('[data-testid="chat-input"]').should('be.visible');
      cy.get('[data-testid="chat-send"]').should('exist');
    });
  });

  context('War Room', () => {
    beforeEach(() => {
      cy.visit('/war-room', { timeout: 30000 });
      waitForHydration();
    });

    it('renders the live telemetry header', () => {
      cy.contains('h1', 'Live Infrastructure Telemetry').should('be.visible');
      cy.contains('LIVE').should('exist');
    });

    it('renders the observability stack linking to /api/health', () => {
      cy.contains('Observability Stack').should('be.visible');
      cy.contains('a', 'Health API').should('have.attr', 'href', '/api/health');
    });
  });

  context('Work', () => {
    beforeEach(() => {
      cy.visit('/work', { timeout: 30000 });
      waitForHydration();
    });

    it('renders the hero and at least one featured project card', () => {
      cy.contains('h1', /Systems with/i).should('be.visible');
      cy.contains('Featured systems').should('be.visible');
      cy.get('article').should('have.length.gte', 1);
    });
  });

  context('Experience', () => {
    beforeEach(() => {
      cy.visit('/experience', { timeout: 30000 });
      waitForHydration();
    });

    it('renders the Home Depot entry', () => {
      cy.contains('The Home Depot').should('be.visible');
    });
  });

  context('Skills', () => {
    beforeEach(() => {
      cy.visit('/skills', { timeout: 30000 });
      waitForHydration();
    });

    it('renders the technical skills heading', () => {
      cy.contains('Technical Skills').should('be.visible');
    });
  });

  context('Contact', () => {
    beforeEach(() => {
      cy.visit('/contact', { timeout: 30000 });
      waitForHydration();
    });

    it('renders headline, resume request CTA, and the email social link', () => {
      cy.contains('h1', /Get In Touch/i).should('be.visible');
      cy.contains('a', 'Request Resume')
        .should('have.attr', 'href')
        .and('include', 'mailto:luisgimenezdev@gmail.com');
      cy.contains('a', 'luisgimenezdev@gmail.com').should('exist');
    });
  });
});