import { onBeforeUnmount, ref } from "vue";

import type { Animal } from "@/modules/bots/roster";
import { createUciClient, createWorkerTransport, type UciEngineClient } from "@/shared/engine";

// One worker per animal, kept for as long as the view is open. Starting a worker costs a few
// milliseconds and a bot is asked for hundreds of moves, so they are made once and reused; a
// `ucinewgame` is what separates one game from the next.
export function useBotEngines() {
	const engines = new Map<string, UciEngineClient>();
	const thinking = ref(false);

	function engineFor(animal: Animal): UciEngineClient {
		const existing = engines.get(animal.definition.id);
		if (existing) return existing;

		const worker = new Worker(
			new URL("../../../workers/uciEngine.worker.ts", import.meta.url),
			{
				type: "module",
			}
		);
		// The definition goes first, before any UCI line: the worker has no bot until it arrives.
		// Bound rather than called as a method — see `createWorkerTransport` for why.
		const post = worker.postMessage.bind(worker);
		post({ definition: animal.definition, name: animal.definition.id });

		const client = createUciClient({ transport: createWorkerTransport({ worker }) });
		engines.set(animal.definition.id, client);

		return client;
	}

	async function askForMove({
		animal,
		fen,
		moves,
	}: {
		animal: Animal;
		fen?: string;
		moves?: string[];
	}): Promise<{ move: string; score?: number }> {
		const engine = engineFor(animal);

		thinking.value = true;
		try {
			await engine.init();
			engine.setPosition({ fen, moves });

			return await engine.go({ depth: animal.definition.search.depth });
		} finally {
			thinking.value = false;
		}
	}

	// A fresh seed per game, because the engine's default is the bot's own id: without this every
	// game starts from the same rng state and a bot answers a given opponent identically forever.
	// The seed only breaks ties while `temperature` is zero, but it is the game's seed either way.
	async function startNewGame(): Promise<void> {
		await Promise.all(
			[...engines.values()].map((engine) => {
				engine.setOption({ name: "Seed", value: crypto.randomUUID() });
				return engine.newGame();
			})
		);
	}

	onBeforeUnmount(() => {
		for (const engine of engines.values()) engine.dispose();
		engines.clear();
	});

	return { askForMove, startNewGame, thinking };
}
