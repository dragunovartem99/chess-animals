import { describe, expect, it } from "vitest";

import { seedState } from "../../engine";
import { engine } from "../../test-support/wasm";
import { onlyWeights } from "../../test-support/weights";
import { SEARCH_POSITIONS } from "../__benchmarks__/positions";

// A regression guard, not the target — `npm run bench` prints the real numbers. A pass is ~1.2 ms;
// the headroom absorbs the suite's other files contending for the same cores.
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

// With a shuffle, because that is the path the roster takes: a shuffled root is searched out
// of generated order, so timing it without one times nothing real.
function pass() {
	for (const fen of SEARCH_POSITIONS) {
		engine.search({ fen, weights: WEIGHTS, options: { depth: 3 }, rngState: seedState(1) });
	}
}

function millisecondsPerPass(): number {
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
