import type { Chess } from "chessops/chess";

import { createDescend, type Descend, createDrawTest, legalMoves, type Repetition } from "../chess";
import type { PlayedMove, WeightVector } from "../eval";
import { createLeaf, type Leaf } from "./leaf";
import { orderMoves } from "./ordering";

// What a position the game cannot continue from is worth to the side standing in it. See
// `createDrawTest` for why it is a flat zero and not a tunable contempt.
export const DRAW_SCORE = 0;

const INFINITY = Number.POSITIVE_INFINITY;

// Everything one search holds for the whole of its life: where it puts the position it is trying,
// what it has already stood in, and what it does when it stops descending.
export type SearchContext = {
	descend: Descend;
	repetition: Repetition;
	drawn: (position: Chess) => boolean;
	leaf: Leaf;
};

export type Frame = {
	context: SearchContext;
	position: Chess;
	played?: PlayedMove;
	depth: number;
	ply: number;
	alpha: number;
	beta: number;
};

export function createSearchContext({
	weights,
	options,
	repetition,
}: {
	weights: WeightVector;
	options: { quiescence?: boolean; nodeLimit?: number };
	repetition: Repetition;
}): SearchContext {
	const descend = createDescend();
	const drawn = createDrawTest(repetition);

	const leaf = createLeaf({
		weights,
		quiescence: options.quiescence ?? false,
		nodeLimit: options.nodeLimit ?? INFINITY,
		descend,
		drawn,
		drawScore: DRAW_SCORE,
	});

	return { descend, repetition, drawn, leaf };
}

// Negamax with alpha-beta, fail-soft. The context travels in the frame rather than in a closure
// so the recursion is a plain function of what it was handed — the frame is allocated per node
// either way, and one more field on it costs nothing next to the closure a factory would need.
//
// The draw test comes before the move list and before the evaluation: the game does not go on
// from a drawn position, so there is nothing to search and nothing to score.
//
// At a leaf the move list is never walked, so it is not built — a mated leaf needs no special
// case, because the evaluation recognises the mate itself and quiescence finds no captures to try
// from one.
export function negamax(frame: Frame): number {
	const { context, position, depth, ply, alpha, beta } = frame;
	const { descend, repetition, leaf } = context;

	if (context.drawn(position)) return DRAW_SCORE;
	if (depth <= 0 || leaf.exhausted()) return leaf.score(frame);

	const moves = legalMoves(position);
	// No moves means the game is over here — mate or stalemate. Hand the check state to the
	// evaluation so `terminalScore` runs one of the two probes rather than both.
	if (moves.length === 0)
		return leaf.evaluate({ position, played: frame.played, ply, inCheck: position.isCheck() });

	let best = -INFINITY;

	// One push for the whole loop: this position is an ancestor of every move tried below it, and
	// it comes off however the loop ends.
	repetition.push(position);

	for (const move of orderMoves({ position, moves })) {
		const score = -negamax({
			context,
			position: descend({ position, move, ply: ply + 1 }),
			played: { parent: position, move },
			depth: depth - 1,
			ply: ply + 1,
			alpha: -beta,
			beta: -Math.max(alpha, best),
		});

		if (score > best) best = score;
		if (best >= beta) break;
	}

	repetition.pop();

	return best;
}
