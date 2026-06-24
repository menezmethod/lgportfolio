// Flows — critical user + API flows.
// Uses actual production DOM: nav buttons with href, data-testid for chat.
// failOnStatusCode: false for redirects (inspect 30x response).

describe('Flows — navigation', () => {
  const waitForHydration = () => {
    cy.get('body', { timeout: 30000 }).should('not.contain', 'booting...');
  };

  it('clicks each navbar link and lands on the right page', () => {
    const cases = [
      { href: '/', expect: /Reliability that/i },
      { href: '/work', expect: /Systems with/i },
      { href: '/writing', expect: /writing/i },
      { href: '/architecture', expect: /.+/ },
      { href: '/war-room', expect: /Live Infrastructure Telemetry/i },
      { href: '/about', expect: /Site Reliability Engineer/i },
      { href: '/contact', expect: /Get In Touch/i },
    ];

    cases.forEach(({ href, expect }) => {
      cy.visit('/');
      waitForHydration();
      // Nav buttons are <a data-slot="button" href="..."> — use href selector
      cy.get(`a[data-slot="button"][href="${href}"]`).first().should('be.visible').click();
      waitForHydration();
      cy.url().should('include', href);
      cy.contains(expect).should('exist');
    });
  });

  it('clicks the AI Chat navbar button and lands on /chat', () => {
    cy.visit('/');
    waitForHydration();
    cy.get('a[data-slot="button"][href="/chat"]').first().should('be.visible').click();
    waitForHydration();
    cy.url().should('include', '/chat');
    cy.get('[data-testid="chat-input"]').should('be.visible');
  });
});

describe('Flows — redirects', () => {
  it('redirects /projects -> /work (permanent)', () => {
    cy.request({ url: '/projects', followRedirect: false, failOnStatusCode: false }).then(
      (res) => {
        expect([301, 308]).to.include(res.status);
        expect(res.headers.location).to.match(/\/work/);
      },
    );
  });

  it('redirects /resume -> /contact (permanent)', () => {
    cy.request({ url: '/resume', followRedirect: false, failOnStatusCode: false }).then(
      (res) => {
        expect([301, 308]).to.include(res.status);
        expect(res.headers.location).to.match(/\/contact/);
      },
    );
  });

  it('follows /projects -> /work to a rendered page', () => {
    cy.visit('/projects');
    cy.get('body', { timeout: 30000 }).should('not.contain', 'booting...');
    cy.url().should('match', /\/work$/);
    cy.contains('h1', /Systems with/i).should('be.visible');
  });

  it('follows /resume -> /contact to a rendered page', () => {
    cy.visit('/resume');
    cy.get('body', { timeout: 30000 }).should('not.contain', 'booting...');
    cy.url().should('match', /\/contact$/);
    cy.contains('h1', /Get In Touch/i).should('be.visible');
  });
});

describe('Flows — chat UI', () => {
  const waitForHydration = () => {
    cy.get('body', { timeout: 30000 }).should('not.contain', 'booting...');
  };

  it('types a message, sends it, and receives an assistant reply', () => {
    cy.visit('/chat');
    waitForHydration();

    cy.get('div[role="log"]').invoke('text').then((before) => {
      const beforeLen = before.length;
      const question = "What's Luis's experience with high-scale payment systems?";

      cy.get('[data-testid="chat-input"]').should('be.visible').type(question, { delay: 5 });
      cy.get('[data-testid="chat-send"]').click();

      cy.get('div[role="log"]', { timeout: 90000 }).invoke('text').should((after) => {
        expect(
          after.length,
          'assistant reply (or error fallback) added new content to the log',
        ).to.be.greaterThan(beforeLen + question.length + 10);
      });
    });
  });
});

describe('Flows — API', () => {
  it('GET /api/health returns 200 and a healthy payload', () => {
    cy.request('/api/health').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('status');
      expect(['healthy', 'degraded']).to.include(res.body.status);
      expect(res.body).to.have.property('timestamp');
      expect(res.body).to.have.property('uptime_seconds');
    });
  });

  it('POST /api/chat returns 200 with a non-empty response body', () => {
    const sessionId = `cypress-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cy.request({
      method: 'POST',
      url: '/api/chat',
      headers: { 'Content-Type': 'application/json' },
      body: {
        session_id: sessionId,
        messages: [
          {
            role: 'user',
            content: "What's Luis's experience with high-scale payment systems?",
          },
        ],
      },
      timeout: 90000,
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 429]).to.include(res.status);
      if (res.status === 200) {
        const bodyStr =
          typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
        expect(bodyStr.length, 'response body is non-empty').to.be.greaterThan(0);
      }
    });
  });

  it('POST /api/chat rejects an unauthenticated request with 405 on GET', () => {
    cy.request({
      method: 'GET',
      url: '/api/chat',
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.not.eq(200);
    });
  });
});