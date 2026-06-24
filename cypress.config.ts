import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "https://gimenez.dev",
    supportFile: false,
    specPattern: "cypress/e2e/**/*.cy.ts",
    defaultCommandTimeout: 30000,
    pageLoadTimeout: 30000,
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
  },
});
