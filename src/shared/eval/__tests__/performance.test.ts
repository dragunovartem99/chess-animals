import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { BENCHMARK_POSITIONS } from "../__benchmarks__/positions";
import { extractFeatures } from "../extract";

// Extraction runs once per node of every search of every game of every tournament, so it sets the
// ceiling on how fast a ranking can be. This is a regression guard, not the target: it is set
// with enough headroom to survive a loaded or slower machine without flaking. `npm run bench`
// prints the real number, and PLAN.md carries the target the tuner needs.
const BUDGET_MICROSECONDS = 60;

const WARMUP = 20_000;
const RUNS = 100_000;

function microsecondsPerPosition(): number {
	const positions = BENCHMARK_POSITIONS.map((fen) => positionFromFen(fen));

	for (let index = 0; index < WARMUP; index += 1) {
		extractFeatures({ position: positions[index % positions.length] });
	}

	const started = performance.now();
	for (let index = 0; index < RUNS; index += 1) {
		extractFeatures({ position: positions[index % positions.length] });
	}

	return ((performance.now() - started) * 1000) / RUNS;
}

describe("extractFeatures", () => {
	it("stays inside its per-position budget", { timeout: 120_000 }, () => {
		const measured = microsecondsPerPosition();

		expect(measured).toBeLessThan(BUDGET_MICROSECONDS);
	});
});
