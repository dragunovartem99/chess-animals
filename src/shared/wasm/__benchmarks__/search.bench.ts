import { expect, test } from "vitest";

import { loadEngine } from "..";
import type { SearchOptions } from "../../engine";
import { onlyWeights } from "../../test-support/weights";
import { SEARCH_POSITIONS } from "./positions";

const engine = await loadEngine();

const weights = onlyWeights({
	materialPawn: 100,
	materialKnight: 320,
	materialBishop: 330,
	materialRook: 500,
	materialQueen: 900,
});

// Material only, so the numbers time the search rather than one animal's features; the
// per-feature cost is `npm run engine:bench`'s. No shuffle: the root's order is the tie-break,
// not the cost.
const SETTINGS: { name: string; options: SearchOptions }[] = [
	{ name: "depth 2", options: { depth: 2 } },
	{ name: "depth 3", options: { depth: 3 } },
	{ name: "depth 3 + quiescence", options: { depth: 3, quiescence: true } },
];

test("search across a spread of positions", async ({ bench }) => {
	const runs = SETTINGS.map(({ name, options }) =>
		bench(name, () => {
			for (const fen of SEARCH_POSITIONS) engine.search({ fen, weights, options });
		})
	);

	const results = await bench.compare(...runs);

	// Each setting does strictly more work than the one before it; a run that comes out faster
	// timed something other than the search, so the numbers above it are not worth reading.
	const means = runs.map(({ name }) => results.get(name).latency.mean);
	expect(means).toEqual(means.toSorted((a, b) => a - b));
});
