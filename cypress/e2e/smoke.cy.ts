describe("Smoke", () => {
  it("loads the homepage", () => {
    cy.visit("/");
    cy.contains("Systems Architect.").should("be.visible");
  });

  it("loads the about page", () => {
    cy.visit("/about");
    cy.contains("Systems Thinker").should("be.visible");
  });

  it("loads the chat page", () => {
    cy.visit("/chat");
    cy.get('[data-testid="chat-input"]').should("exist");
  });

  it("loads the war room page", () => {
    cy.visit("/war-room");
    cy.contains("Live Infrastructure Telemetry").should("be.visible");
  });

  it("loads the work page", () => {
    cy.visit("/work");
    cy.get("h1").should("exist");
  });
});
