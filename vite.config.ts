import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		// `<piece>` is chessground's own element: the promotion picker writes one by hand so the
		// board's piece images can be reused, and Vue must not look for a component of that name.
		vue({ template: { compilerOptions: { isCustomElement: (tag) => tag === "piece" } } }),
	],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
});
