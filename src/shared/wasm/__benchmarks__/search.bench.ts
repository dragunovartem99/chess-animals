import { bench, describe } from "vitest";

import { loadEngine } from "..";
import { positionFromFen } from "../../chess";
import { searchRoot, type SearchOptions } from "../../engine";
import { SEARCH_POSITIONS } from "../../engine/__benchmarks__/positions";
import { onlyWeights } from "../../test-support/weights";

const engine = await loadEngine();
const positions = SEARCH_POSITIONS.map((fen) => ({ fen, position: positionFromFen(fen) }));

// The TS search bench's material-only vector, so the two columns time the same bot.
const weights = onlyWeights({
	materialPawn: 100,
	materialKnight: 320,
	materialBishop: 330,
	materialRook: 500,
	materialQueen: 900,
});

// Side by side until cutover, when the TS column is deleted. Neither shuffles: the root's order is
// the tie-break, not the cost, and generated order keeps the two on the same moves.
const SETTINGS: SearchOptions[] = [{ depth: 2 }, { depth: 3 }, { depth: 3, quiescence: true }];

for (const options of SETTINGS) {
	const label = `depth ${options.depth}${options.quiescence ? " + quiescence" : ""}`;

	describe(`search ${label} across a spread of positions`, () => {
		bench("ts", () => {
			for (const { position } of positions) {
				searchRoot({ position, weights, options, prune: true });
			}
		});

		bench("wasm", () => {
			for (const { fen } of positions) engine.search({ fen, weights, options });
		});
	});
}
