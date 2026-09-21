import { computed, onBeforeUnmount, ref } from "vue";
import type { Ref } from "vue";

import type { Animal } from "@/modules/bots/roster";
import { createUciClient, createWorkerTransport } from "@/shared/engine";
import type { UciEngineClient } from "@/shared/engine";

function spawnEngine(animal: Animal): UciEngineClient {
	const worker = new Worker(new URL("../../../workers/uciEngine.worker.ts", import.meta.url), {
		type: "module",
	});
	// The definition goes first, before any UCI line: the worker has no bot until it arrives.
	// Bound rather than called as a method — see `createWorkerTransport` for why.
	const post = worker.postMessage.bind(worker);
	post({ definition: animal.definition, name: animal.definition.id });

	const client = createUciClient({ transport: createWorkerTransport({ worker }) });
	// The handshake happens once, not once per move: `uci` and `isready` are two round trips
	// across the worker boundary, and a bot is asked for hundreds of moves. Every caller still
	// awaits `init` before it sends anything, and gets the same settled promise back.
	const ready = client.init();

	return { ...client, init: () => ready };
}

// A fresh seed per game, because the engine's default is the bot's own id: without this every
// game starts from the same rng state and a bot answers a given opponent identically forever.
// The seed only breaks ties between equal moves, but that is all the variety a bot has.
async function reseed(engines: Map<string, UciEngineClient>): Promise<void> {
	await Promise.all(
		[...engines.values()].map((engine) => {
			engine.setOption({ name: "Seed", value: crypto.randomUUID() });
			return engine.newGame();
		})
	);
}

function cachedEngine({
	engines,
	animal,
}: {
	engines: Map<string, UciEngineClient>;
	animal: Animal;
}): UciEngineClient {
	const existing = engines.get(animal.definition.id);
	if (existing) return existing;

	const client = spawnEngine(animal);
	engines.set(animal.definition.id, client);

	return client;
}

async function askEngine({
	engine,
	depth,
	thinking,
	fen,
	moves,
}: {
	engine: UciEngineClient;
	depth: number;
	thinking: Ref<boolean>;
	fen?: string;
	moves?: string[];
}): Promise<{ move: string; score?: number }> {
	// Loading is not thinking: the first move of a bot waits on its wasm, and for a monster
	// on Stockfish too, which `prepare` has already shown as loading.
	await engine.init();

	thinking.value = true;
	try {
		engine.setPosition({ fen, moves });

		return await engine.go({ depth });
	} finally {
		thinking.value = false;
	}
}

// One worker per animal, kept for as long as the view is open. Starting a worker costs a few
// milliseconds and a bot is asked for hundreds of moves, so they are made once and reused; a
// `ucinewgame` is what separates one game from the next.
export function useBotEngines() {
	const engines = new Map<string, UciEngineClient>();
	const thinking = ref(false);
	// A count rather than a flag: the picker can swap a bot while another is still loading, and
	// the first to finish must not clear the state for the one still on its way.
	const pending = ref(0);

	const engineFor = (animal: Animal) => cachedEngine({ engines, animal });
	const askForMove = ({
		animal,
		fen,
		moves,
	}: {
		animal: Animal;
		fen?: string;
		moves?: string[];
	}) =>
		askEngine({
			engine: engineFor(animal),
			depth: animal.definition.search.depth,
			thinking,
			fen,
			moves,
		});

	// Starts every bot that is about to play, so the board can wait for all of them at once: the
	// handshake settles only once a worker has its engine — the wasm, Stockfish, whatever it runs
	// on — so an answered `isready` is what "loaded" means for any kind of opponent.
	async function prepare(animals: Animal[]): Promise<void> {
		pending.value += 1;
		try {
			await Promise.all(animals.map((animal) => engineFor(animal).init()));
		} finally {
			pending.value -= 1;
		}
	}

	const startNewGame = (): Promise<void> => reseed(engines);

	onBeforeUnmount(() => {
		for (const engine of engines.values()) engine.dispose();
		engines.clear();
	});

	const loading = computed(() => pending.value > 0);

	return { askForMove, prepare, startNewGame, thinking, loading };
}
