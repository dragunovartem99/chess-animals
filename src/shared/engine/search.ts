import type { Chess } from "chessops/chess";
import type { NormalMove } from "chessops/types";

import { afterMove, legalMoves } from "../chess";
import type { PhaseWeights, PlayedMove } from "../eval";
import { evaluatePosition } from "./evaluate";
import { orderMoves } from "./ordering";
import { createQuiescence } from "./quiescence";

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

type Frame = { position: Chess; played?: PlayedMove; depth: number; alpha: number; beta: number };

function createSearch({ weights, options }: { weights: PhaseWeights; options: SearchOptions }) {
	const limit = options.nodeLimit ?? INFINITY;
	let nodes = 0;

	const evaluate = ({ position, played }: { position: Chess; played?: PlayedMove }) => {
		nodes += 1;
		return evaluatePosition({ position, played, weights });
	};

	const quiesce = createQuiescence({ evaluate, exhausted: () => nodes >= limit });

	function negamax({ position, played, depth, alpha, beta }: Frame): number {
		const moves = legalMoves(position);

		// No moves means mate or stalemate. Both are scored by the evaluation rather than by a
		// hardcoded win, because `givesMate` and `givesStalemate` are weights a bot may set
		// however it likes — including negative.
		if (moves.length === 0) return evaluate({ position, played });

		if (depth <= 0 || nodes >= limit) {
			return options.quiescence
				? quiesce({ position, played, alpha, beta })
				: evaluate({ position, played });
		}

		let best = -INFINITY;

		for (const move of orderMoves({ position, moves })) {
			const child = afterMove({ position, move });
			const score = -negamax({
				position: child,
				played: { parent: position, move },
				depth: depth - 1,
				alpha: -beta,
				beta: -Math.max(alpha, best),
			});

			if (score > best) best = score;
			if (best >= beta) break;
		}

		return best;
	}

	return { negamax, nodeCount: () => nodes };
}

// Every legal move with what it is worth to the mover, searched to the requested depth.
//
// Each root move is searched with a full window rather than the narrowing one a normal engine
// would use. An engine only needs the best move, so it can afford scores that are merely bounds;
// the policy here samples across the scores at non-zero temperature, and a bound would distort
// the distribution it samples from.
export function searchRoot({
	position,
	weights,
	options,
}: {
	position: Chess;
	weights: PhaseWeights;
	options: SearchOptions;
}): ScoredMove[] {
	const { negamax } = createSearch({ weights, options });

	return legalMoves(position).map((move) => ({
		move,
		score: -negamax({
			position: afterMove({ position, move }),
			played: { parent: position, move },
			depth: options.depth - 1,
			alpha: -INFINITY,
			beta: INFINITY,
		}),
	}));
}
