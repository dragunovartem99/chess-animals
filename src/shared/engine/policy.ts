import type { Chess } from "chessops/chess";
import type { NormalMove } from "chessops/types";

import type { Repetition } from "../chess";
import type { WeightVector } from "../eval";
import type { Rng } from "./rng";
import { softmaxSample } from "./sample";
import { type ScoredMove, searchRoot, type SearchOptions } from "./search";

export type { ScoredMove };

// Every legal move with what it is worth to the mover. At `depth: 1` this is pure greed — score
// each child, take the best — which is the paper's own ground rule; deeper is the same search
// looking further.
export function scoreMoves({
	position,
	weights,
	search,
	temperature = 0,
	repetition,
}: {
	position: Chess;
	weights: WeightVector;
	search: SearchOptions;
	// A bot that only takes the argmax lets the search narrow its window on the non-best moves;
	// one that samples needs their scores exact. Defaults to the argmax case.
	temperature?: number;
	// The positions the game has already stood in, so a move back into one scores as the draw it
	// is. A caller with no game behind it leaves it out.
	repetition?: Repetition;
}): ScoredMove[] {
	return searchRoot({
		position,
		weights,
		options: search,
		prune: temperature <= 0,
		repetition,
	});
}

// The sampling half of the policy, over scores someone else has already searched. It is split out
// so a caller that needs both the move and the scores behind it — the UCI layer reports the score
// it played on — pays for one search rather than two.
//
// `temperature` is in the same units as the scores: at zero this is a plain argmax with the tie
// broken by the rng, and above zero the bot samples, which is how the paper's weighted-sampling
// players work — and what stops two deterministic bots replaying one identical game every time
// the arena pairs them.
export function pickMove({
	scored,
	temperature,
	rng,
}: {
	scored: ScoredMove[];
	temperature: number;
	rng: Rng;
}): NormalMove | undefined {
	if (scored.length === 0) return undefined;

	const index = softmaxSample({ scores: scored.map((entry) => entry.score), temperature, rng });

	return scored[index].move;
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
		scored: scoreMoves({ position, weights, search, temperature, repetition }),
		temperature,
		rng,
	});
}
