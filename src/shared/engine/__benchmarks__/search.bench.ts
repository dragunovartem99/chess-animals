import { bench } from "vitest";

import { positionFromFen } from "../../chess";
import { onlyWeights } from "../../test-support/weights";
import { createRng } from "../rng";
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

// `prune` is what an argmax bot (`temperature: 0`, the whole roster) actually runs, and it runs
// it with an rng, whose shuffled root is where its tie-break lives — so the argmax pass carries
// one too, or it would be timing a path no bot takes. The unpruned pass is what a sampling bot
// pays and the contrast worth watching.
// One rng for the whole run: reseeding per search would time `createRng` as much as the search.
const shuffling = createRng(1);
const rngFor = (prune: boolean) => (prune ? shuffling : undefined);

for (const prune of [true, false]) {
	const label = prune ? "argmax" : "sampling";

	for (const depth of [1, 2, 3]) {
		bench(`searchRoot depth ${depth} (${label}) across a spread of positions`, () => {
			for (const position of positions) {
				searchRoot({ position, weights, options: { depth }, prune, rng: rngFor(prune) });
			}
		});
	}

	bench(`searchRoot depth 3 + quiescence (${label}) across a spread of positions`, () => {
		for (const position of positions) {
			searchRoot({
				position,
				weights,
				options: { depth: 3, quiescence: true },
				prune,
				rng: rngFor(prune),
			});
		}
	});
}
