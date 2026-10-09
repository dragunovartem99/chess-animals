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

// For the arena's threads and the specs; starts on the first line sent. `getBuiltinModule`, not
// `import`, so vite never resolves `node:child_process` for the browser bundle.
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
