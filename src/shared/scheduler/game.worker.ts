import { parentPort } from "node:worker_threads";

// Explicit extensions: this file is loaded as a worker entry, resolved by the raw Node/tsx/vitest
// loader rather than the bundler, so it does not get the extensionless resolution the rest of the
// tree relies on.
import { runGame } from "./runGame.ts";
import type { GameSpec } from "./types.ts";

// Thin by design: the pool owns the thread and the queue, this owns only the pipe. Every game is
// independent, so one message in, one report out, no state between them.
if (parentPort) {
	const post = parentPort.postMessage.bind(parentPort);
	parentPort.on("message", (spec: GameSpec) => post(runGame(spec)));
}
