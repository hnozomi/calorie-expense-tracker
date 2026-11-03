import { defineConfig } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const { plugins, rules } = reactHooks.configs.flat.recommended;

// Biome has no React Compiler rules (setState in an Effect, impure render), so ESLint runs only those
export default defineConfig([
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}", "src/__tests__/**"],
    languageOptions: { parser: tseslint.parser },
    plugins,
    rules,
  },
]);
