/**
 * Single source of truth for the application version.
 *
 * Reads from package.json at build time via Next.js env.
 * Every place that needs the version (health API, War Room, UI)
 * imports APP_VERSION from here — no hardcoded strings elsewhere.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require("../../package.json") as { version: string };

export const APP_VERSION: string = pkg.version;
