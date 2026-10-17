import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: [
      "src/app/admin/board/page.tsx",
      "src/app/admin/conversations/page.tsx",
      "src/app/admin/logs/page.tsx",
      "src/app/chat/page.tsx",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: [
      "src/app/chat/page.tsx",
    ],
    rules: {
      "react-hooks/refs": "off",
    },
  },
]);

export default eslintConfig;
