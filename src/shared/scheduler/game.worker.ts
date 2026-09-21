import { parentPort } from "node:worker_threads";

import { tsImport } from "tsx/esm/api";

import type * as SeaModule from "../sea";
import type * as ProcessModule from "../sea/process";
import type * as WasmModule from "../wasm";
import type * as RunGameModule from "./runGame";
import type { GameSpec } from "./types.ts";

// `tsImport` rather than a plain import, and it is the only reason this file is async.
//
// A worker inherits no loader from its parent, and `execArgv` cannot hand it a whole one. The
// `tsx` binary gives the parent two halves — `--import loader.mjs` transforms TypeScript, and
// `--require preflight.cjs` installs the resolver that turns `"../bots"` into `../bots/index.ts`
// — and a worker's `execArgv` silently drops `--require`. So the entry compiled and then died on
// the first barrel import below it (`runGame`'s `from "../bots"`, `ERR_UNSUPPORTED_DIR_IMPORT`),
// which killed the arena the moment a game missed the result cache. `tsImport` compiles the graph
// itself, resolution included, and needs nothing from `execArgv` at all.
//
// Awaited before the port is listened to, which is safe: a `MessagePort` queues what arrives
// until the first `message` listener starts it, so no spec posted during startup is lost.
const { runGame } = (await tsImport("./runGame.ts", import.meta.url)) as typeof RunGameModule;
const wasm = (await tsImport("../wasm/index.ts", import.meta.url)) as typeof WasmModule;
const sea = (await tsImport("../sea/index.ts", import.meta.url)) as typeof SeaModule;
const host = (await tsImport("../sea/process.ts", import.meta.url)) as typeof ProcessModule;

// One engine per worker, loaded before the first game: its tables are built once and every game
// on this thread reuses them.
const goSearch = wasm.createWasmGoSearch(await wasm.loadEngine());

// One Stockfish per worker, like the engine, and like it reused by every game here. It is only a
// description until a game with a sea animal in it sends the first line: the process starts then.
const stockfish = sea.createStockfish({ transport: host.createProcessTransport() });

// Thin by design: the pool owns the thread and the queue, this owns only the pipe. Every game is
// independent, so one message in, one report out, no state between them.
if (parentPort) {
	const post = parentPort.postMessage.bind(parentPort);
	parentPort.on("message", async (spec: GameSpec) =>
		post(await runGame({ spec, goSearch, stockfish }))
	);
}
