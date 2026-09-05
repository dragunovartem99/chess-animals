import type { Chess } from "chessops/chess";
import type { NormalMove } from "chessops/types";

import { createRepetition, legalMoves, type Repetition } from "../chess";
import type { WeightVector } from "../eval";
import { createSearchContext, negamax } from "./negamax";
import { orderMoves } from "./ordering";
import type { Rng } from "./rng";

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

// What the root hands back: a score for every move, and the move the search actually settled on.
//
// `best` is not "the first entry with the top score", and a caller must not recompute it that
// way. Under `prune` a worse move can report the top score — it is a bound, not a value — so the
// only move known to be worth that score is the one that set it, which is this.
export type RootSearch = { scored: ScoredMove[]; best?: NormalMove };

const INFINITY = Number.POSITIVE_INFINITY;

// Fisher-Yates over a copy of the move list. This is where a bot's tie-break lives: the root
// keeps the first move that strictly beats every move before it, so shuffling first is what makes
// that a uniform choice among equals — and it costs a search nothing, where comparing reported
// scores cost every tie its cutoff.
function shuffled({ moves, rng }: { moves: NormalMove[]; rng: Rng }): NormalMove[] {
	const order = moves.slice();

	for (let index = order.length - 1; index > 0; index -= 1) {
		const swap = rng.int(index + 1);
		[order[index], order[swap]] = [order[swap], order[index]];
	}

	return order;
}

// The order the root searches its moves in.
//
// Best-capture-first so the narrowing window bites sooner — but a shuffled root is *not* ordered
// on top of the shuffle. The order the root searches in is the tie-break, the first of the equals
// winning, so sorting it afterwards hands every tie to the same move: with captures first, the
// Donkey, whose moves all tie, took every capture on the board and stopped being a random mover
// at all. Deeper nodes still order, which is where it pays anyway — this is one node.
//
// `orderMoves` sorts in place, so the root — the one caller that still needs the generated order
// afterwards, to report the scores in it — hands it a copy.
function rootOrder({
	position,
	moves,
	prune,
	rng,
}: {
	position: Chess;
	moves: NormalMove[];
	prune: boolean;
	rng?: Rng;
}): NormalMove[] {
	if (rng) return shuffled({ moves, rng });

	return prune ? orderMoves({ position, moves: moves.slice() }) : moves;
}

// One root move, from the mover's side. The window is the caller's: `beta` is what the pruning
// narrows as the best score rises, and `INFINITY` is the full window every move gets without it.
function scoreRootMove({
	context,
	position,
	move,
	depth,
	beta,
}: {
	context: ReturnType<typeof createSearchContext>;
	position: Chess;
	move: NormalMove;
	depth: number;
	beta: number;
}): number {
	return -negamax({
		context,
		position: context.descend({ position, move, ply: 1 }),
		played: { parent: position, move },
		depth: depth - 1,
		ply: 1,
		alpha: -INFINITY,
		beta,
	});
}

// Every legal move with what it is worth to the mover, searched to the requested depth.
//
// `prune` narrows the window as the best root score rises, the way a normal engine always would.
// It is off by default because a non-best move then comes back as a bound rather than a value,
// and the policy samples across those scores at non-zero temperature — a bound would distort the
// distribution. A caller taking only the argmax reads `best` instead, which no bound can reach.
//
// `rng` shuffles the order the moves are searched in, which is the whole of a bot's tie-break.
// Without one the root is deterministic and `best` is the first of the equals in generated order.
//
// `repetition` carries the game so far, so a move back into a position the players have already
// stood in scores as the draw it is heading for. A caller with no game behind it — a test scoring
// one position out of nowhere — leaves it out and gets the same search without that.
export function searchRoot({
	position,
	weights,
	options,
	prune = false,
	rng,
	repetition = createRepetition(),
}: {
	position: Chess;
	weights: WeightVector;
	options: SearchOptions;
	prune?: boolean;
	rng?: Rng;
	repetition?: Repetition;
}): RootSearch {
	const context = createSearchContext({ weights, options, repetition });
	const moves = legalMoves(position);

	// The scores are reported in generated order whatever order they were searched in, so a
	// caller sees the same list whether or not the search pruned or shuffled.
	const order = rootOrder({ position, moves, prune, rng });
	const scoreByMove = new Map<NormalMove, number>();
	let best = -INFINITY;
	let bestMove: NormalMove | undefined;
	let beta = INFINITY;

	repetition.push(position);

	for (const move of order) {
		const score = scoreRootMove({ context, position, move, depth: options.depth, beta });

		scoreByMove.set(move, score);
		// Strictly greater, so the first of the equals wins and the shuffle above is what decides
		// which one that is.
		if (score > best) {
			best = score;
			bestMove = move;
			if (prune) beta = -best;
		}
	}

	repetition.pop();

	return {
		scored: moves.map((move) => ({ move, score: scoreByMove.get(move)! })),
		best: bestMove,
	};
}
