import type { MaiaSession } from "./maia";

// Maia over `onnxruntime-web`, in the browser and under node alike — `onnxruntime-node` segfaults
// loading this model, and one runtime for the arena and the page means the arena rates what the
// page plays.
//
// The runtime and the model both load on the first move, not when the session is made: a game
// with no underwater animal in it, or a thread that never meets one, never pays the ~23 MB.
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

// How the session is built, part of what decides Maia's move — so the arena's result cache keys
// on it beside the model. The int8 weights are stored as `DequantizeLinear` + `Cast` to fp16, and
// onnxruntime keeps quantization nodes out of constant folding by default, for its int8 fusions.
// Here that left the weights dequantized on every move: ~160 ms a move against ~110 with it off.
// Folded once at load, the moves sit exactly as close to upstream's as before.
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
