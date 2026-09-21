import { availableParallelism } from "node:os";
import { Worker } from "node:worker_threads";

import type { GoSearch } from "../engine";
import type { Stockfish } from "../sea";
import { runGame } from "./runGame";
import type { GameReport, GameSpec } from "./types";

export const WORKER_URL = new URL("./game.worker.ts", import.meta.url);

// Enough of a loader to compile the worker *entry*; everything the entry imports is resolved by
// `tsImport` inside it instead, for the reason written there. Harmless when `tsx` is already
// active, and the one thing that covers a worker started from a plain `node`/vitest process.
export const WORKER_EXEC_ARGV = ["--import", "tsx"];

// Runs every spec and returns the reports in spec order — the order is what makes a run
// reproducible regardless of how the games were spread across threads. One worker per core by
// default; each pulls the next spec as it finishes the last, so a slow game never idles a core.
export async function runGames({
	specs,
	concurrency = availableParallelism(),
	onProgress,
}: {
	specs: readonly GameSpec[];
	concurrency?: number;
	onProgress?: (completed: number, total: number) => void;
}): Promise<GameReport[]> {
	const reports: GameReport[] = [];
	if (specs.length === 0) return reports;

	let next = 0;
	let completed = 0;
	const threads = Math.max(1, Math.min(concurrency, specs.length));

	const drive = (worker: Worker) =>
		new Promise<void>((resolve, reject) => {
			// Bound to a plain call so it reads as a pipe write, not a `window.postMessage`.
			const post = worker.postMessage.bind(worker);
			let current = -1;
			const feed = () => {
				if (next >= specs.length) {
					void worker.terminate();
					resolve();
					return;
				}
				current = next++;
				post(specs[current]);
			};
			worker.on("message", (report: GameReport) => {
				reports[current] = report;
				onProgress?.((completed += 1), specs.length);
				feed();
			});
			worker.on("error", (error) => {
				void worker.terminate();
				reject(error);
			});
			feed();
		});

	await Promise.all(
		Array.from({ length: threads }, () =>
			drive(new Worker(WORKER_URL, { execArgv: WORKER_EXEC_ARGV }))
		)
	);
	return reports;
}

// The same contract without threads — for a handful of games, a test, or a debugger. Kept here
// so callers depend on one module whether or not they want a pool. The caller brings the search,
// as the worker does, so the two play the same games.
export async function runGamesSerially({
	specs,
	goSearch,
	stockfish,
}: {
	specs: readonly GameSpec[];
	goSearch: GoSearch;
	stockfish?: Stockfish;
}): Promise<GameReport[]> {
	const reports: GameReport[] = [];
	for (const spec of specs) reports.push(await runGame({ spec, goSearch, stockfish }));

	return reports;
}
