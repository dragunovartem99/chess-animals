import { copyFile } from "node:fs/promises";
import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig, type Plugin } from "vite";

// GitHub Pages serves the repo under a sub-path and knows nothing about the router, so a deep
// link like `/chess-animals/en/play` is a 404 on its way in. Pages hands those to `404.html`,
// and shipping a copy of the shell there lets the router take the url from the client.
const spaFallback = (): Plugin => ({
	name: "spa-fallback",
	closeBundle: async () => {
		await copyFile("dist/index.html", "dist/404.html");
	},
});

export default defineConfig({
	base: "/chess-animals/",
	plugins: [
		spaFallback(),
		// `<piece>` is chessground's own element: the promotion picker writes one by hand so the
		// board's piece images can be reused, and Vue must not look for a component of that name.
		vue({ template: { compilerOptions: { isCustomElement: (tag) => tag === "piece" } } }),
	],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	// The arena writes tens of thousands of result files under `.cache/`; left unignored, the dev
	// server tries to watch each one and trips the OS file-watcher limit (ENOSPC) on startup.
	server: { watch: { ignored: ["**/.cache/**"] } },
});
