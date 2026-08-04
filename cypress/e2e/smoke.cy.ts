describe("Smoke", () => {
  it("loads the homepage", () => {
    cy.visit("/");
    cy.contains("Luis Gimenez").should("be.visible");
    cy.contains("Site Reliability Engineer").should("be.visible");
  });

  it("loads the about page", () => {
    cy.visit("/about");
    cy.contains("Site Reliability Engineer").should("be.visible");
  });

  it("loads the writing page", () => {
    cy.visit("/writing");
    cy.get("h1").should("contain", "Writing");
  });

  it("loads the contact page", () => {
    cy.visit("/contact");
    cy.contains("luisgimenezdev@gmail.com").should("be.visible");
  });
});
