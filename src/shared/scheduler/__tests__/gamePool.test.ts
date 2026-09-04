import { describe, expect, it } from "vitest";

import { createGamePool, runGamesSerially } from "..";
import type { GameSpec } from "..";
import type { BotDefinition } from "../../bots";
import { openings } from "../../openings";

// Spawns a `worker_threads` pool that compiles its TypeScript entry on start — well over the
// default 5 s test timeout, especially under coverage.
const WORKER_TIMEOUT = 60_000;

const A: BotDefinition = {
	id: "a",
	search: { depth: 1 },
	temperature: 30,
	weights: { materialPawn: 20, materialKnight: 60, captureValue: 6 },
};
const B: BotDefinition = {
	id: "b",
	search: { depth: 1 },
	temperature: 30,
	weights: { mobility: 5, swarm: -20 },
};

function specs(count: number): GameSpec[] {
	return Array.from({ length: count }, (_, i) => {
		const opening = openings[i % openings.length];
		const swap = i % 2 === 0;
		return {
			white: swap ? A : B,
			black: swap ? B : A,
			openingFen: opening.fen,
			seed: i,
			plyLimit: 16,
		};
	});
}

describe("createGamePool", () => {
	it(
		"matches the serial runner across many concurrent run() calls with a capped worker count",
		async () => {
			const pool = createGamePool({ concurrency: 2 });
			try {
				const batches = [specs(6), specs(8), specs(4)];
				const results = await Promise.all(batches.map((batch) => pool.run(batch)));
				batches.forEach((batch, i) => {
					expect(results[i]).toEqual(runGamesSerially(batch));
				});
			} finally {
				await pool.close();
			}
		},
		WORKER_TIMEOUT
	);

	it(
		"keeps reports in spec order regardless of which worker finished first",
		async () => {
			const pool = createGamePool({ concurrency: 4 });
			try {
				const batch = specs(20);
				expect(await pool.run(batch)).toEqual(runGamesSerially(batch));
			} finally {
				await pool.close();
			}
		},
		WORKER_TIMEOUT
	);
});
