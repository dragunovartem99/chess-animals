import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		environment: "node",
		mockReset: true,
		passWithNoTests: true,
		coverage: {
			provider: "v8",
			// Only the code tests can actually reach: configs, barrels, locale data and Vue
			// components would otherwise dilute the numbers the thresholds guard.
			include: ["src/modules/*/{utils,composables}/**/*.ts", "src/shared/*/**/*.ts"],
			exclude: [
				"**/__tests__/**",
				"**/__benchmarks__/**",
				"**/index.ts",
				"**/types/**",
				"src/shared/test-support/**",
			],
			thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
		},
	},
});
