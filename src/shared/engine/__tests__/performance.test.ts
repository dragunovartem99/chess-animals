import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { onlyWeights } from "../../test-support/weights";
import { SEARCH_POSITIONS } from "../__benchmarks__/positions";
import { searchRoot } from "../search";

// The search runs once per move of every game of every tournament, and its cost is dominated by
// the per-node evaluation. This is a regression guard, not the target: it is set with enough
// headroom to survive a loaded or slower machine without flaking. `npm run bench` prints the real
// numbers, and PLAN.md carries the arena budget the whole thing has to fit inside.
//
// Depth 2 is the shallowest depth that actually exercises alpha-beta, move ordering and the
// child-node blend, so a regression in any of those shows up here. `prune` is the path an argmax
// bot takes — the whole roster — so it is what the guard should watch. The real number is ~13 ms
// (`npm run bench`); the budget carries wide headroom because the suite's other files run in
// parallel and contend for the same cores while this measures wall time.
const BUDGET_MILLISECONDS = 150;

// v8's coverage instrumentation multiplies per-node cost, so under `npm run test:coverage` the
// number measures the instrumentation rather than the search. There the guard only keeps the
// search exercised; `npm test` holds it to the real budget.
const BUDGET = process.env.COVERAGE ? BUDGET_MILLISECONDS * 6 : BUDGET_MILLISECONDS;

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
	const positions = SEARCH_POSITIONS.map((fen) => positionFromFen(fen));
	const pass = () => {
		for (const position of positions) {
			searchRoot({ position, weights: WEIGHTS, options: { depth: 2 }, prune: true });
		}
	};

	for (let index = 0; index < WARMUP_PASSES; index += 1) pass();

	const started = performance.now();
	for (let index = 0; index < MEASURED_PASSES; index += 1) pass();

	return (performance.now() - started) / MEASURED_PASSES;
}

describe("searchRoot", () => {
	it("stays inside its per-pass budget at depth two", { timeout: 120_000 }, () => {
		expect(millisecondsPerPass()).toBeLessThan(BUDGET);
	});
});
