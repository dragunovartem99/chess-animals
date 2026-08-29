import type { Chess } from "chessops/chess";
import type { NormalMove } from "chessops/types";

import { afterMove, legalMoves } from "../chess";
import type { PhaseWeights } from "../eval";
import { evaluatePosition } from "./evaluate";
import type { Rng } from "./rng";
import { softmaxSample } from "./sample";

export type ScoredMove = { move: NormalMove; score: number };

// Every legal move with what it is worth to the mover.
//
// The score is the *negation* of the child position's evaluation, because that evaluation is
// written from the side to move's point of view, and after our move that side is the opponent.
// This is the whole of negamax at depth one, and it is why the move-level features are stored
// negated (see `eval/families/move.ts`): a positive weight means "the mover wants this".
//
// Note what is deliberately absent: checkmate is not special-cased into a winning score. It is
// the `givesMate` weight, which a serious bot sets enormous and `pacifist` sets negative. Every
// personality in the paper, including the ones that refuse to win, is expressible that way.
export function scoreMoves({
	position,
	weights,
}: {
	position: Chess;
	weights: PhaseWeights;
}): ScoredMove[] {
	return legalMoves(position).map((move) => ({
		move,
		score: -evaluatePosition({
			position: afterMove({ position, move }),
			played: { parent: position, move },
			weights,
		}),
	}));
}

// The move a bot plays from this position, or `undefined` when the game is already over.
//
// `temperature` is in the same units as the scores: at zero this is a plain argmax with the tie
// broken by the rng, and above zero the bot samples, which is how the paper's weighted-sampling
// players work — and what stops two deterministic bots replaying one identical game every time
// the arena pairs them.
export function chooseMove({
	position,
	weights,
	temperature,
	rng,
}: {
	position: Chess;
	weights: PhaseWeights;
	temperature: number;
	rng: Rng;
}): NormalMove | undefined {
	const scored = scoreMoves({ position, weights });
	if (scored.length === 0) return undefined;

	const index = softmaxSample({ scores: scored.map((entry) => entry.score), temperature, rng });

	return scored[index].move;
}
