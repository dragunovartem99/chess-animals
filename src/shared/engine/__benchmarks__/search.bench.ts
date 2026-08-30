import { bench } from "vitest";

import { positionFromFen } from "../../chess";
import { onlyWeights } from "../../test-support/weights";
import { searchRoot } from "../search";
import { SEARCH_POSITIONS } from "./positions";

const positions = SEARCH_POSITIONS.map((fen) => positionFromFen(fen));

// A material-only vector: representative of what the search spends its time on (extract + blend +
// dot per node), without a behavioural weight skewing which branch wins.
const weights = onlyWeights({
	materialPawn: 100,
	materialKnight: 320,
	materialBishop: 330,
	materialRook: 500,
	materialQueen: 900,
});

for (const depth of [1, 2, 3]) {
	bench(`searchRoot depth ${depth} across a spread of positions`, () => {
		for (const position of positions) searchRoot({ position, weights, options: { depth } });
	});
}

bench("searchRoot depth 3 with quiescence across a spread of positions", () => {
	for (const position of positions) {
		searchRoot({ position, weights, options: { depth: 3, quiescence: true } });
	}
});
