import { availableParallelism } from "node:os";
import { Worker } from "node:worker_threads";

import { WORKER_EXEC_ARGV, WORKER_URL } from "./pool";
import type { GameReport, GameSpec } from "./types";

type Job = {
	spec: GameSpec;
	resolve: (report: GameReport) => void;
	reject: (error: unknown) => void;
};

export type GamePool = {
	run: (specs: readonly GameSpec[]) => Promise<GameReport[]>;
	close: () => Promise<void>;
};

// A fixed set of long-lived workers behind one shared queue. Unlike `runGames`, which spawns and
// tears down a pool per call, this keeps exactly `concurrency` threads alive across many `run`
// calls — so a caller that fires dozens of `run`s at once (the arena plays every pair of a round
// concurrently) still never exceeds `concurrency` workers or repays the tsx-startup cost per batch.
export function createGamePool({
	concurrency = availableParallelism(),
}: { concurrency?: number } = {}): GamePool {
	const workers = Array.from(
		{ length: Math.max(1, concurrency) },
		() => new Worker(WORKER_URL, { execArgv: WORKER_EXEC_ARGV })
	);
	const idle = [...workers];
	const queue: Job[] = [];

	const pump = () => {
		while (idle.length > 0 && queue.length > 0) {
			const worker = idle.pop()!;
			// Bound to a plain call so it reads as a pipe write, not a `window.postMessage`.
			const post = worker.postMessage.bind(worker);
			const job = queue.shift()!;
			const onError = (error: unknown) => {
				worker.off("message", onMessage);
				job.reject(error);
			};
			const onMessage = (report: GameReport) => {
				worker.off("message", onMessage);
				worker.off("error", onError);
				idle.push(worker);
				job.resolve(report);
				pump();
			};
			worker.on("message", onMessage);
			worker.once("error", onError);
			post(job.spec);
		}
	};

	return {
		run: (specs) =>
			Promise.all(
				specs.map(
					(spec) =>
						new Promise<GameReport>((resolve, reject) => {
							queue.push({ spec, resolve, reject });
							pump();
						})
				)
			),
		close: async () => {
			await Promise.all(workers.map((worker) => worker.terminate()));
		},
	};
}
