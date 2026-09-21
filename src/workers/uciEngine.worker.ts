import { compileBot } from "@/shared/bots";
import type { BotDefinition } from "@/shared/bots";
import { createWorkerTransport } from "@/shared/engine";
import type { UciCommand, UciResponse } from "@/shared/engine";
import { parseCommand } from "@/shared/engine/uci/parseCommand";
import { serializeResponse } from "@/shared/engine/uci/serialize";
import { createUciEngine } from "@/shared/engine/uciEngine";
import { createMonsterEngine, createStockfish } from "@/shared/monsters";
import { createMaiaSession, createUnderwaterEngine } from "@/shared/underwater";
import { createWasmGoSearch, loadEngine } from "@/shared/wasm";
import type { WasmEngine } from "@/shared/wasm";

// Vendored in `public/`, so it is served as it is and only fetched by the first monster that
// plays: the land roster never pays for its 1.8 MB. Its script and its wasm sit side by side,
// which is where the script looks for it.
const STOCKFISH_URL = `${import.meta.env.BASE_URL}stockfish/stockfish-19-lite-single.js`;

// Vendored in `public/` for the same reason, and fetched by the first underwater animal that plays:
// nobody else pays for its 46 MB.
const MAIA_MODEL_URL = `${import.meta.env.BASE_URL}maia3/maia3_simplified.onnx`;

async function fetchModel(): Promise<Uint8Array> {
	const response = await fetch(MAIA_MODEL_URL);
	return new Uint8Array(await response.arrayBuffer());
}

// What any kind of bot is to this file: a command in, responses out, now or a moment later.
type Engine = { handle: (command: UciCommand) => UciResponse[] | Promise<UciResponse[]> };

// The worker is deliberately almost empty: it owns a bot and a pipe, and everything it does with
// them is in `createUciEngine`, where it can be tested without spawning anything.
//
// The first message must be the bot definition; every message after it is a UCI line.
let engine: Promise<Engine> | undefined;

// Loading starts with the worker, not with the first `go`, so the fetch overlaps the handshake.
const wasm = loadEngine();

function build({
	module,
	definition,
	name,
}: {
	module: WasmEngine;
	definition: BotDefinition;
	name: string;
}): Engine {
	const config = compileBot(definition);
	if (config.maia) {
		const session = createMaiaSession({ load: fetchModel });
		return createUnderwaterEngine({
			config,
			name,
			session,
			goSearch: createWasmGoSearch(module),
		});
	}
	if (!config.stockfish)
		return createUciEngine({ config, name, goSearch: createWasmGoSearch(module) });

	const worker = new Worker(STOCKFISH_URL);
	const stockfish = createStockfish({ transport: createWorkerTransport({ worker }) });
	return createMonsterEngine({ config, name, stockfish, goSearch: createWasmGoSearch(module) });
}

// The lines are handled in the order they came even though the first ones wait on the module: a
// `go` answered before the `position` it follows would search the wrong board.
let queue = Promise.resolve();

// See `createWorkerTransport`: a worker's `postMessage` has no target-origin argument.
const post = self.postMessage.bind(self);

async function answer({ ready, line }: { ready: Promise<Engine>; line: string }): Promise<void> {
	for (const response of await (await ready).handle(parseCommand(line))) {
		post(serializeResponse(response));
	}
}

self.addEventListener(
	"message",
	(event: MessageEvent<string | { definition: BotDefinition; name: string }>) => {
		const { data } = event;
		if (typeof data !== "string") {
			engine = wasm.then((module) => build({ module, ...data }));
			return;
		}

		const ready = engine;
		if (!ready) return;

		// A line that throws is reported and dropped, not left to reject the chain: every line
		// after it would otherwise go unanswered, and the caller wait on them forever.
		queue = queue.then(() => answer({ ready, line: data })).catch(reportError);
	}
);
