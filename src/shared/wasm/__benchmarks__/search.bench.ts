import { bench, describe } from "vitest";

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
const SETTINGS: SearchOptions[] = [{ depth: 2 }, { depth: 3 }, { depth: 3, quiescence: true }];

describe("search across a spread of positions", () => {
	for (const options of SETTINGS) {
		const label = `depth ${options.depth}${options.quiescence ? " + quiescence" : ""}`;

		bench(label, () => {
			for (const fen of SEARCH_POSITIONS) engine.search({ fen, weights, options });
		});
	}
});
