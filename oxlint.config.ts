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
});
