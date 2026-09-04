import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { BENCHMARK_POSITIONS } from "../__benchmarks__/positions";
import { extractFeatures } from "../extract";

// Extraction runs once per node of every search of every game of every tournament, so it sets the
// ceiling on how fast a ranking can be. This is a regression guard, not the target: `npm run
// bench` prints the real number, and PLAN.md carries the target the tuner needs.
const BUDGET_MICROSECONDS = 50;

// v8's coverage instrumentation costs more per position than the budget itself, so under
// `npm run test:coverage` the number measures the instrumentation rather than the extractor.
// There the guard only keeps extraction exercised; `npm test` holds it to the real budget.
const BUDGET = process.env.COVERAGE ? BUDGET_MICROSECONDS * 5 : BUDGET_MICROSECONDS;

const WARMUP = 20_000;
const BATCHES = 50;
const RUNS_PER_BATCH = 2_000;

// The **fastest** batch, not the mean of one long one. Vitest runs the suite's files in parallel
// threads, so a run that measures wall time is competing with every other file for the same
// cores: the mean measured whatever else the machine happened to be doing, and the budget had to
// carry enough headroom to absorb that, which left it too loose to catch anything. Splitting the
// same work into batches and keeping the best one asks the question actually worth asking — how
// fast is this when it gets a clean slice of a core — and answers it much closer to the same way
// on a busy machine as on an idle one. The batches are short so that some of them fit inside one:
// the real number is ~18 µs, and this reads about 30 µs with the whole suite running beside it,
// which is what the budget has to leave room for.
function microsecondsPerPosition(): number {
	const positions = BENCHMARK_POSITIONS.map((fen) => positionFromFen(fen));
	let index = 0;
	const run = () => extractFeatures({ position: positions[index++ % positions.length] });

	for (let pass = 0; pass < WARMUP; pass += 1) run();

	let best = Infinity;
	for (let batch = 0; batch < BATCHES; batch += 1) {
		const started = performance.now();
		for (let pass = 0; pass < RUNS_PER_BATCH; pass += 1) run();

		best = Math.min(best, ((performance.now() - started) * 1000) / RUNS_PER_BATCH);
	}

	return best;
}

describe("extractFeatures", () => {
	it("stays inside its per-position budget", { timeout: 120_000 }, () => {
		const measured = microsecondsPerPosition();

		expect(measured).toBeLessThan(BUDGET);
	});
});
