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

// The slack that keeps a cutoff off the window. Searching a root move against exactly `-best`
// cuts off when its score merely *reaches* the best, and a cutoff reports the bound rather than
// the score — so a strictly worse move comes back reading exactly `best` and the argmax's
// tie-break, which cannot tell a bound from a value, spreads over it: the Parrot answered
// 1.e4 e5 2.Nf3 with 2...Ne7 one game in three, scoring it 500 points below 2...Nf6.
//
// One epsilon of window is the whole fix. A cutoff now needs a score of `best - EPSILON` or
// less, so no bound can land on `best` and every move still reading it is an exact tie. Two
// distinct evaluations never land this close — they are sums of centipawn weights — and if they
// ever did the only cost would be an exact score for a move that is worse by a millionth.
const TIE_EPSILON = 1e-6;

// Every legal move with what it is worth to the mover, searched to the requested depth.
//
// `prune` narrows the window as the best root score rises, the way a normal engine always would.
// It is off by default because a non-best move then comes back as a bound rather than a value,
// and the policy samples across those scores at non-zero temperature — a bound would distort the
// distribution. When the caller will only take the argmax (`temperature <= 0`) the bounds are
// harmless, but only because of the re-search below: a cutoff that lands exactly on the window
// is otherwise indistinguishable from a real tie, and the tie-break would spread over both.
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
			beta: prune ? -best + TIE_EPSILON : INFINITY,
		});

		scoreByMove.set(move, score);
		if (score > best) best = score;
	}

	repetition.pop();

	return moves.map((move) => ({ move, score: scoreByMove.get(move)! }));
}
