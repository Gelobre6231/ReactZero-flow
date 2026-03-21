/**
 * eslint.config.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * ESLint flat config (ESLint 9+).
 *
 * Plugins:
 * - @typescript-eslint: TypeScript-specific rules
 * - eslint-plugin-react: React best practices
 * - eslint-plugin-react-hooks: enforces Rules of Hooks
 */

import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
	js.configs.recommended,
	{
		files: ["src/**/*.{ts,tsx}"],
		plugins: {
			"@typescript-eslint": ts,
			react,
			"react-hooks": reactHooks,
		},
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
				ecmaFeatures: { jsx: true },
			},
			globals: {
				...globals.browser,
			},
		},
		settings: {
			react: { version: "detect" },
		},
		rules: {
			// ── TypeScript ────────────────────────────────────────────────────────
			"no-undef": "off", // TypeScript handles this; no-undef doesn't understand TS types
			"no-unused-vars": "off", // Use @typescript-eslint version instead
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],

			// ── React ─────────────────────────────────────────────────────────────
			"react/prop-types": "off", // TypeScript handles this
			"react/react-in-jsx-scope": "off", // React 17+ new JSX transform
			"react/display-name": "warn", // Helps with devtools debugging
			"react/no-unknown-property": "error",

			// ── React Hooks ───────────────────────────────────────────────────────
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",

			// ── General ───────────────────────────────────────────────────────────
			"no-console": "warn",
			"prefer-const": "error",
			"no-var": "error",
		},
	},
	{
		// Relax rules in test files and add test globals
		files: ["src/**/*.{test,spec}.{ts,tsx}", "src/__tests__/**"],
		languageOptions: {
			globals: {
				...globals.node,
				// Vitest globals (globals: true in vitest.config.ts)
				describe: "readonly",
				it: "readonly",
				test: "readonly",
				expect: "readonly",
				vi: "readonly",
				beforeEach: "readonly",
				afterEach: "readonly",
				beforeAll: "readonly",
				afterAll: "readonly",
			},
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"no-unused-vars": "off",
			"no-console": "off",
		},
	},
	{
		ignores: [
			"dist/**",
			"node_modules/**",
			"coverage/**",
			"test-results/**",
			"playwright-report/**",
		],
	},
];
