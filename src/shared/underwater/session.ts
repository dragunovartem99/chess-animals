import type * as web from "onnxruntime-web/wasm";

import type { MaiaSession } from "./maia";

// What a session needs of an onnxruntime package: the two are the same API over different
// backends, `onnxruntime-web` in the browser and `onnxruntime-node` in the arena.
type Ort = Pick<typeof web, "InferenceSession" | "Tensor">;
type SessionOptions = Parameters<Ort["InferenceSession"]["create"]>[1];
export type MaiaRuntime = () => Promise<{ ort: Ort; options?: SessionOptions }>;

// Part of the arena's cache key, since it decides Maia's move. Folding the int8 `DequantizeLinear`
// nodes once at load takes a move from ~160 ms to ~110, the moves unchanged.
export const MAIA_SESSION_OPTIONS = { extra: { session: { disable_quant_qdq: "1" } } };

// The wasm-only build: the default one carries WebGPU too, twice the download for a backend this
// never asks for. One thread: several would need a cross-origin-isolated page.
export const webRuntime: MaiaRuntime = async () => {
	const ort = await import("onnxruntime-web/wasm");
	ort.env.wasm.numThreads = 1;
	return { ort };
};

// Loads on the first move, not at creation. The two runtimes give the same logits from this
// model, so the arena rates the Maia the page plays whichever it runs.
export function createMaiaSession({
	load,
	runtime = webRuntime,
}: {
	load: () => Promise<Uint8Array>;
	runtime?: MaiaRuntime;
}): MaiaSession {
	let opened: ReturnType<typeof open> | undefined;
	const start = () => (opened ??= open({ load, runtime }));

	return {
		async ready() {
			await start();
		},
		async run({ tokens, elo }) {
			const { ort, session } = await start();
			// The model also takes the opponent's rating; it is given the animal's own, so an animal
			// plays the same whoever sits across the board.
			const rating = new ort.Tensor("float32", Float32Array.of(elo), [1]);
			const output = await session.run({
				tokens: new ort.Tensor("float32", tokens, [1, 64, 12]),
				elo_self: rating,
				elo_oppo: rating,
			});

			return output.logits_move.data as Float32Array;
		},
	};
}

async function open({ load, runtime }: { load: () => Promise<Uint8Array>; runtime: MaiaRuntime }) {
	const { ort, options } = await runtime();
	const session = await ort.InferenceSession.create(await load(), {
		...MAIA_SESSION_OPTIONS,
		...options,
	});

	return { ort, session };
}
