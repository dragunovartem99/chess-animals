import type { Chess } from "chessops/chess";
import type { NormalMove } from "chessops/types";

import type { Repetition } from "../chess";
import type { WeightVector } from "../eval";
import type { Rng } from "./rng";
import { softmaxSample } from "./sample";
import { type RootSearch, type ScoredMove, searchRoot, type SearchOptions } from "./search";

export type { RootSearch, ScoredMove };

// Every legal move with what it is worth to the mover. At `depth: 1` this is pure greed — score
// each child, take the best — which is the paper's own ground rule; deeper is the same search
// looking further.
export function scoreMoves({
	position,
	weights,
	search,
	temperature = 0,
	rng,
	repetition,
}: {
	position: Chess;
	weights: WeightVector;
	search: SearchOptions;
	// A bot that only takes the argmax lets the search narrow its window on the non-best moves;
	// one that samples needs their scores exact. Defaults to the argmax case.
	temperature?: number;
	// Breaks the tie between equally good moves, by shuffling the order the root searches them
	// in. Only an argmax bot needs it — a sampling one draws its variety from the distribution.
	rng?: Rng;
	// The positions the game has already stood in, so a move back into one scores as the draw it
	// is. A caller with no game behind it leaves it out.
	repetition?: Repetition;
}): RootSearch {
	const argmax = temperature <= 0;

	return searchRoot({
		position,
		weights,
		options: search,
		prune: argmax,
		rng: argmax ? rng : undefined,
		repetition,
	});
}

// The sampling half of the policy, over a search someone else has already run. It is split out
// so a caller that needs both the move and the scores behind it — the UCI layer reports the score
// it played on — pays for one search rather than two.
//
// `temperature` is in the same units as the scores: at zero the bot takes what the root settled
// on, its tie already broken by the shuffled search order, and above zero it samples, which is
// how the paper's weighted-sampling players work — and what stops two deterministic bots
// replaying one identical game every time the arena pairs them.
//
// The argmax reads `root.best` rather than the top of `root.scored` because a pruned search
// reports worse moves as bounds, and a bound can read exactly the top score. Taking the maximum
// of the scores here is what made the Parrot answer 1.e4 e5 2.Nf3 with 2...Ne7.
export function pickMove({
	root,
	temperature,
	rng,
}: {
	root: RootSearch;
	temperature: number;
	rng: Rng;
}): NormalMove | undefined {
	if (temperature <= 0) return root.best;
	if (root.scored.length === 0) return undefined;

	const index = softmaxSample({
		scores: root.scored.map((entry) => entry.score),
		temperature,
		rng,
	});

	return root.scored[index].move;
}

// The move a bot plays from this position, or `undefined` when the game is already over.
export function chooseMove({
	position,
	weights,
	search,
	temperature,
	rng,
	repetition,
}: {
	position: Chess;
	weights: WeightVector;
	search: SearchOptions;
	temperature: number;
	rng: Rng;
	repetition?: Repetition;
}): NormalMove | undefined {
	return pickMove({
		root: scoreMoves({ position, weights, search, temperature, rng, repetition }),
		temperature,
		rng,
	});
}
