import type { BotConfig } from "../bots";
import type { UciTransport } from "./client";
import { parseCommand } from "./uci/parseCommand";
import { serializeResponse } from "./uci/serialize";
import { createUciEngine } from "./uciEngine";

// A worker that already speaks UCI over `postMessage` — ours, and `stockfish.wasm` unchanged.
export function createWorkerTransport({ worker }: { worker: Worker }): UciTransport {
	// Bound rather than called as a method: `Worker.postMessage` takes no target origin, unlike
	// the `window` method of the same name that the lint rule is written for.
	const post = worker.postMessage.bind(worker);

	return {
		send: (line) => post(line),
		subscribe: (handler) => {
			worker.addEventListener("message", (event: MessageEvent<string>) =>
				handler(event.data)
			);
		},
		dispose: () => worker.terminate(),
	};
}

// The same engine, in this thread. One game against one bot does not need a worker, and a test
// should not have to spawn one to exercise the protocol.
export function createLocalTransport({
	config,
	name,
}: {
	config: BotConfig;
	name: string;
}): UciTransport {
	const engine = createUciEngine({ config, name });
	const handlers: ((line: string) => void)[] = [];

	return {
		send: (line) => {
			for (const response of engine.handle(parseCommand(line))) {
				const text = serializeResponse(response);
				for (const handler of handlers) handler(text);
			}
		},
		subscribe: (handler) => {
			handlers.push(handler);
		},
		dispose: () => {
			handlers.length = 0;
		},
	};
}
