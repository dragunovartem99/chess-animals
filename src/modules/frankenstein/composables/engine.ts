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

	return createUciClient({ transport: createWorkerTransport({ worker }) });
}
