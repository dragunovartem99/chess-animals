import type { BotDefinition } from "@/shared/bots";
import { createUciClient, createWorkerTransport, type UciEngineClient } from "@/shared/engine";

export const ENGINE_NAME = "frankenstein";

// A worker, not the local (in-thread) transport `createLocalTransport` gives a test: `go` runs a
// real negamax search, and running that on the main thread stalls the board's own move animation
// until the search returns. `setOption` posts to the worker exactly like any other UCI line, so
// live weight and depth edits stay just as immediate — only the actual search moves off-thread.
export function buildEngine({
	weights,
	depth,
	quiescence,
}: {
	weights: Record<string, number>;
	depth: number;
	quiescence: boolean;
}): UciEngineClient {
	const definition: BotDefinition = {
		id: ENGINE_NAME,
		search: { depth, quiescence },
		temperature: 0,
		// Spread into a plain object: `weights` is a Vue-reactive proxy, and `postMessage`'s
		// structured clone cannot serialise one — only the values it wraps.
		weights: { middlegame: { ...weights } },
	};

	const worker = new Worker(new URL("../../../workers/uciEngine.worker.ts", import.meta.url), {
		type: "module",
	});
	// Bound rather than called as a method — see `createWorkerTransport` for why.
	const post = worker.postMessage.bind(worker);
	post({ definition, name: ENGINE_NAME });

	const engine = createUciClient({ transport: createWorkerTransport({ worker }) });
	reseed(engine);

	return engine;
}

// The engine's RNG seed defaults to its id, which is the constant `ENGINE_NAME` for every build —
// without this, every fresh engine (and every `reset()` on the same one) ties-break identically,
// so two autoplay runs from the same weights would replay the exact same game move for move.
export function reseed(engine: UciEngineClient): void {
	engine.setOption({ name: "Seed", value: crypto.randomUUID() });
}
