import type { ChildProcess } from "node:child_process";

import type { UciTransport } from "../engine";

// The vendored build's script and its wasm, side by side: the script is a UCI engine on stdin and
// stdout when node runs it directly, and finds its wasm beside itself.
export const STOCKFISH_URL = new URL(
	"../../../public/stockfish/stockfish-19-lite-single.js",
	import.meta.url
);
export const STOCKFISH_WASM_URL = new URL(
	"../../../public/stockfish/stockfish-19-lite-single.wasm",
	import.meta.url
);

// Stockfish as a child process, for the hosts that have no worker to give it — the arena's game
// threads and the specs. The browser hands the same `createStockfish` a worker's transport, and
// the monster engine cannot tell.
//
// The process starts on the first line sent, so a thread that never plays a monster never
// pays for one. `getBuiltinModule` rather than an `import`, as in `loadEngine`: vite would try to
// resolve `node:child_process` for the browser bundle this file sits beside.
export function createProcessTransport(): UciTransport {
	const handlers: ((line: string) => void)[] = [];
	let child: ChildProcess | undefined;

	function spawn(): ChildProcess {
		const { spawn: start } = process.getBuiltinModule("node:child_process");
		const { createInterface } = process.getBuiltinModule("node:readline");
		const started = start("node", [STOCKFISH_URL.pathname], {
			stdio: ["pipe", "pipe", "inherit"],
		});
		createInterface({ input: started.stdout! }).on("line", (line) => {
			for (const handler of handlers) handler(line);
		});

		return started;
	}

	return {
		send: (line) => {
			child ??= spawn();
			child.stdin!.write(`${line}\n`);
		},
		subscribe: (handler) => {
			handlers.push(handler);
		},
		dispose: () => child?.kill(),
	};
}
