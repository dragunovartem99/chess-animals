import type { Chess } from "chessops/chess";
import type { NormalMove } from "chessops/types";

import type { Repetition } from "../chess";
import type { WeightVector } from "../eval";
import type { Rng } from "./rng";
import { type RootSearch, type ScoredMove, searchRoot, type SearchOptions } from "./search";

export type { RootSearch, ScoredMove };

// Every legal move with what it is worth to the mover. At `depth: 1` this is pure greed — score
// each child, take the best — which is the paper's own ground rule; deeper is the same search
// looking further.
//
// Always pruned: a bot only ever plays the argmax, so the non-best moves may come back as bounds
// and the search is free to narrow its window on them. Sampling across the scores used to need
// them exact, and was dropped — a bot's variety comes from its tie-break and the opening set, and
// a dial that threw evaluation away was only ever used to weaken one animal.
export function scoreMoves({
	position,
	weights,
	search,
	rng,
	repetition,
}: {
	position: Chess;
	weights: WeightVector;
	search: SearchOptions;
	// Breaks the tie between equally good moves, by shuffling the order the root searches them
	// in. Deterministic bots would otherwise replay one another's games move for move.
	rng?: Rng;
	// The positions the game has already stood in, so a move back into one scores as the draw it
	// is. A caller with no game behind it leaves it out.
	repetition?: Repetition;
}): RootSearch {
	return searchRoot({ position, weights, options: search, prune: true, rng, repetition });
}

// The move a bot plays from this position, or `undefined` when the game is already over.
//
// It reads `root.best` rather than the top of `root.scored` because a pruned search reports worse
// moves as bounds, and a bound can read exactly the top score. Taking the maximum of the scores
// here is what made the Parrot answer 1.e4 e5 2.Nf3 with 2...Ne7.
export function chooseMove({
	position,
	weights,
	search,
	rng,
	repetition,
}: {
	position: Chess;
	weights: WeightVector;
	search: SearchOptions;
	rng: Rng;
	repetition?: Repetition;
}): NormalMove | undefined {
	return scoreMoves({ position, weights, search, rng, repetition }).best;
}
