import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

import { emojiFont } from "./cli/emojiFont";

export default defineConfig({
	plugins: [
		emojiFont(),
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
	// ES workers, not the default IIFE: the engine worker loads `onnxruntime-web` with a dynamic
	// import, so only an underwater game fetches it, and IIFE output cannot split a chunk off.
	// Every worker here is already started with `type: "module"`.
	worker: { format: "es" },
});
