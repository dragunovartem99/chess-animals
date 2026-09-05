import type { Chess } from "chessops/chess";
import type { NormalMove } from "chessops/types";

import { createRepetition, legalMoves, type Repetition } from "../chess";
import type { WeightVector } from "../eval";
import { createSearchContext, negamax } from "./negamax";
import { orderMoves } from "./ordering";

export type SearchOptions = {
	depth: number;
	// Extend past the last ply along captures, so the search does not stop in the middle of a
	// trade and report the half of it that suits it.
	quiescence?: boolean;
	// A ceiling on how much work one move may cost. Reaching it does not corrupt the result: the
	// search stops going deeper and falls back on the evaluation it already has.
	nodeLimit?: number;
};

export type ScoredMove = { move: NormalMove; score: number };

const INFINITY = Number.POSITIVE_INFINITY;

// Every legal move with what it is worth to the mover, searched to the requested depth.
//
// `prune` narrows the window as the best root score rises, the way a normal engine always would.
// It is off by default because a non-best move then comes back as a bound rather than a value,
// and the policy samples across those scores at non-zero temperature — a bound would distort the
// distribution. When the caller will only take the argmax (`temperature <= 0`) the bounds are
// harmless: a move that truly ties the best still comes back equal to it, so the seeded
// tie-break is unaffected, and only strictly worse moves are left as bounds.
//
// `repetition` carries the game so far, so a move back into a position the players have already
// stood in scores as the draw it is heading for. A caller with no game behind it — a test scoring
// one position out of nowhere — leaves it out and gets the same search without that.
export function searchRoot({
	position,
	weights,
	options,
	prune = false,
	repetition = createRepetition(),
}: {
	position: Chess;
	weights: WeightVector;
	options: SearchOptions;
	prune?: boolean;
	repetition?: Repetition;
}): ScoredMove[] {
	const context = createSearchContext({ weights, options, repetition });
	const moves = legalMoves(position);

	// Search best-capture-first so the narrowing window bites sooner, but report the moves in
	// generated order regardless: the policy's tie-break picks by index, so a caller must see the
	// same order whether or not the search pruned. `orderMoves` sorts in place, so the root — the
	// one caller that still needs the generated order afterwards — hands it a copy.
	const order = prune ? orderMoves({ position, moves: moves.slice() }) : moves;
	const scoreByMove = new Map<NormalMove, number>();
	let best = -INFINITY;

	repetition.push(position);

	for (const move of order) {
		const score = -negamax({
			context,
			position: context.descend({ position, move, ply: 1 }),
			played: { parent: position, move },
			depth: options.depth - 1,
			ply: 1,
			alpha: -INFINITY,
			beta: prune ? -best : INFINITY,
		});

		scoreByMove.set(move, score);
		if (score > best) best = score;
	}

	repetition.pop();

	return moves.map((move) => ({ move, score: scoreByMove.get(move)! }));
}
