import { describe, expect, it } from "vitest";

import { runGames, runGamesSerially } from "..";
import type { GameSpec } from "..";
import type { BotDefinition } from "../../bots";
import { openings } from "../../openings";

// Every case spawns a `worker_threads` pool that compiles its TypeScript entry on start, which
// the default 5 s test timeout does not allow for — especially under coverage.
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

// A spread of short games: every opening, both colors, a few seeds each.
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

describe("runGames", () => {
	it("returns an empty array for no specs", async () => {
		expect(await runGames({ specs: [] })).toEqual([]);
	});

	it(
		"matches the serial runner report for report",
		async () => {
			const batch = specs(24);
			expect(await runGames({ specs: batch, concurrency: 4 })).toEqual(
				runGamesSerially(batch)
			);
		},
		WORKER_TIMEOUT
	);

	it(
		"gives the same reports whatever the concurrency",
		async () => {
			const batch = specs(40);
			const [one, many] = await Promise.all([
				runGames({ specs: batch, concurrency: 1 }),
				runGames({ specs: batch, concurrency: 8 }),
			]);
			expect(many).toEqual(one);
		},
		WORKER_TIMEOUT
	);

	it(
		"reports progress up to the total",
		async () => {
			const seen: number[] = [];
			const batch = specs(20);
			await runGames({ specs: batch, concurrency: 3, onProgress: (done) => seen.push(done) });
			expect(seen.at(-1)).toBe(20);
			expect(seen).toHaveLength(20);
		},
		WORKER_TIMEOUT
	);

	it("runs 1000 games across the pool and reproduces from seed", async () => {
		const batch = specs(1000);
		const first = await runGames({ specs: batch });
		const second = await runGames({ specs: batch });

		expect(first).toHaveLength(1000);
		expect(first.filter((report) => report.reason !== "ply-limit").length).toBeGreaterThan(0);
		expect(second).toEqual(first);
	}, 120_000);
});
