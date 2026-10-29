import type { MaiaRuntime } from "./session";

// The vendored model, for the hosts that read it off disk — the arena's game threads and the
// specs. The browser fetches the same file from `public/`, by its served path.
export const MAIA_MODEL_URL = new URL("../../../public/maia3/maia3_int8_f32.onnx", import.meta.url);

// `getBuiltinModule` rather than an `import` of `node:fs`, as in `loadEngine`: vite would try to
// resolve it for the browser bundle this file sits beside.
export function readMaiaModel(): Promise<Uint8Array> {
	const { readFile } = process.getBuiltinModule("node:fs/promises");
	return readFile(MAIA_MODEL_URL);
}

// The native runtime, 2× the wasm one on a thread, with the same logits. One thread: the arena
// already runs a game per core, and node's default of every core would oversubscribe them.
export const nodeRuntime: MaiaRuntime = async () => ({
	ort: await import("onnxruntime-node"),
	options: { intraOpNumThreads: 1 },
});
