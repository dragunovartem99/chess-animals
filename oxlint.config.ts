import baseConfig from "@dragunovartem99/oxlint-config";
import { defineConfig } from "oxlint";

// `max-lines` rides the shared config's `pedantic` category at ESLint's bare default (300,
// counting blank lines and comments) unless overridden — pinned here at a tighter 100, and
// counting only real code, so a long file's own doc comments don't quietly eat into its budget.
export default defineConfig({
	extends: [baseConfig],
	rules: {
		"max-lines": ["warn", { max: 100, skipBlankLines: true, skipComments: true }],
	},
	overrides: [
		{
			// A test file is a flat list of cases: a `describe`/`it` runs long because it holds many
			// small assertions, not because it hides a second responsibility, and a table-driven case
			// legitimately loops. Size and no-conditional rules earn their keep on production code.
			files: ["**/__tests__/**", "**/*.test.ts"],
			rules: {
				"max-lines": "off",
				"max-lines-per-function": "off",
				"vitest/no-conditional-in-test": "off",
			},
		},
	],
});
