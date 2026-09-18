import { compileBot } from "@/shared/bots";
import type { BotDefinition } from "@/shared/bots";
import { parseCommand } from "@/shared/engine/uci/parseCommand";
import { serializeResponse } from "@/shared/engine/uci/serialize";
import { createUciEngine } from "@/shared/engine/uciEngine";
import { createWasmGoSearch, loadEngine } from "@/shared/wasm";

// The worker is deliberately almost empty: it owns a bot and a pipe, and everything it does with
// them is in `createUciEngine`, where it can be tested without spawning anything.
//
// The first message must be the bot definition; every message after it is a UCI line.
let engine: Promise<ReturnType<typeof createUciEngine>> | undefined;

// Loading starts with the worker, not with the first `go`, so the fetch overlaps the handshake.
const wasm = loadEngine();

// The lines are handled in the order they came even though the first ones wait on the module: a
// `go` answered before the `position` it follows would search the wrong board.
let queue = Promise.resolve();

// See `createWorkerTransport`: a worker's `postMessage` has no target-origin argument.
const post = self.postMessage.bind(self);

async function answer({
	ready,
	line,
}: {
	ready: Promise<ReturnType<typeof createUciEngine>>;
	line: string;
}): Promise<void> {
	for (const response of (await ready).handle(parseCommand(line))) {
		post(serializeResponse(response));
	}
}

self.addEventListener(
	"message",
	(event: MessageEvent<string | { definition: BotDefinition; name: string }>) => {
		const { data } = event;
		if (typeof data !== "string") {
			const config = compileBot(data.definition);
			engine = wasm.then((module) =>
				createUciEngine({ config, name: data.name, goSearch: createWasmGoSearch(module) })
			);
			return;
		}

		const ready = engine;
		if (!ready) return;

		// A line that throws is reported and dropped, not left to reject the chain: every line
		// after it would otherwise go unanswered, and the caller wait on them forever.
		queue = queue.then(() => answer({ ready, line: data })).catch(reportError);
	}
);
