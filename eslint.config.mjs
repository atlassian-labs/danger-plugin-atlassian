import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Ignore non-source outputs and reports
  { ignores: ["coverage/**", "dist/**", "node_modules/**"] },
  // Apply TypeScript recommended configs only to src/**/* files
  ...tseslint.configs.recommended.map((cfg) => ({
    ...cfg,
    files: ["src/**/*.{ts,tsx,js,mjs,cjs,mts,cts}"],
  })),
  // Apply JS recommended only to src/**/* files
  {
    files: ["src/**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
]);
