import { createEngine, type WasmEngine } from "./engine";

// vite turns `new URL(…, import.meta.url)` into a hashed asset of the build, in a worker as on the
// page; under node — the arena, the CLIs, vitest — it stays a file beside the sources, which
// `make -C engine wasm` writes and every npm script that needs it runs first.
export const ENGINE_URL = new URL("../../../engine/build/engine.wasm", import.meta.url);

// One loader for both rather than one per host: the URL already says which it is, and node's
// `fetch` does not read `file:`. `getBuiltinModule` rather than an `import` of `node:fs`, which
// vite would try to resolve for the browser bundle and warn about on every build.
export async function loadEngine(): Promise<WasmEngine> {
	if (ENGINE_URL.protocol === "file:") {
		const { readFile } = process.getBuiltinModule("node:fs/promises");
		return createEngine(await readFile(ENGINE_URL));
	}

	const response = await fetch(ENGINE_URL);
	return createEngine(await response.arrayBuffer());
}
