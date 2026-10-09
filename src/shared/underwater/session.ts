import type { MaiaSession } from "./maia";

// `onnxruntime-web` under node too: `onnxruntime-node` segfaults on this model, and one runtime
// means the arena rates what the page plays. Loads on the first move, not at creation.
export function createMaiaSession({ load }: { load: () => Promise<Uint8Array> }): MaiaSession {
	let opened: ReturnType<typeof open> | undefined;
	const start = () => (opened ??= open(load));

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

// Part of the arena's cache key, since it decides Maia's move. Folding the int8 `DequantizeLinear`
// nodes once at load takes a move from ~160 ms to ~110, the moves unchanged.
export const MAIA_SESSION_OPTIONS = { extra: { session: { disable_quant_qdq: "1" } } };

// The wasm-only build: the default one carries WebGPU too, twice the download for a backend this
// never asks for.
async function open(load: () => Promise<Uint8Array>) {
	const ort = await import("onnxruntime-web/wasm");
	// One thread: several would need a cross-origin-isolated page in the browser, and the arena
	// already runs a game per core.
	ort.env.wasm.numThreads = 1;
	const session = await ort.InferenceSession.create(await load(), MAIA_SESSION_OPTIONS);

	return { ort, session };
}
