describe("Smoke", () => {
  it("loads the homepage", () => {
    cy.visit("/");
    cy.contains("Senior Platform Engineer").should("be.visible");
  });

  it("loads the about page", () => {
    cy.visit("/about");
    cy.contains("Senior Platform Engineer.").should("be.visible");
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

  it("loads the experience page", () => {
    cy.visit("/experience");
    cy.contains("The Home Depot").should("be.visible");
  });

  it("loads the skills page", () => {
    cy.visit("/skills");
    cy.contains("Technical Skills").should("be.visible");
  });
});
