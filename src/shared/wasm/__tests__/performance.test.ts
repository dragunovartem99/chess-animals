import { describe, expect, it } from "vitest";

import { seedState } from "../../engine";
import { engine } from "../../test-support/wasm";
import { onlyWeights } from "../../test-support/weights";
import { SEARCH_POSITIONS } from "../__benchmarks__/positions";

// The search runs once per move of every game of every tournament. This is a regression guard,
// not the target: `npm run bench` and `npm run engine:bench` print the real numbers. A pass is
// ~1.2 ms at depth 3; the budget carries wide headroom because the suite's other files run in
// parallel and contend for the same cores while this measures wall time. Coverage does not touch
// it — v8 instruments the JS, and the time is spent in wasm.
const BUDGET_MILLISECONDS = 20;

const WEIGHTS = onlyWeights({
	materialPawn: 100,
	materialKnight: 320,
	materialBishop: 330,
	materialRook: 500,
	materialQueen: 900,
});

const WARMUP_PASSES = 3;
const MEASURED_PASSES = 20;

function millisecondsPerPass(): number {
	// With a shuffle, because that is the path the roster takes: a shuffled root is searched out
	// of generated order, so timing it without one times nothing real.
	const pass = () => {
		for (const fen of SEARCH_POSITIONS) {
			engine.search({ fen, weights: WEIGHTS, options: { depth: 3 }, rngState: seedState(1) });
		}
	};

	for (let index = 0; index < WARMUP_PASSES; index += 1) pass();

	const started = performance.now();
	for (let index = 0; index < MEASURED_PASSES; index += 1) pass();

	return (performance.now() - started) / MEASURED_PASSES;
}

describe("the wasm search", () => {
	it("stays inside its per-pass budget at depth three", { timeout: 120_000 }, () => {
		expect(millisecondsPerPass()).toBeLessThan(BUDGET_MILLISECONDS);
	});
});
