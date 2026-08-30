import type { Chess } from "chessops/chess";
import type { NormalMove } from "chessops/types";

import { afterMove, legalMoves } from "../chess";
import type { PhaseWeights, PlayedMove } from "../eval";
import { createEvaluator } from "./evaluate";
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

	const scorePosition = createEvaluator({ weights });
	const evaluate = ({ position, played }: { position: Chess; played?: PlayedMove }) => {
		nodes += 1;
		return scorePosition({ position, played });
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
// `prune` narrows the window as the best root score rises, the way a normal engine always would.
// It is off by default because a non-best move then comes back as a bound rather than a value,
// and the policy samples across those scores at non-zero temperature — a bound would distort the
// distribution. When the caller will only take the argmax (`temperature <= 0`) the bounds are
// harmless: a move that truly ties the best still comes back equal to it, so the seeded
// tie-break is unaffected, and only strictly worse moves are left as bounds.
export function searchRoot({
	position,
	weights,
	options,
	prune = false,
}: {
	position: Chess;
	weights: PhaseWeights;
	options: SearchOptions;
	prune?: boolean;
}): ScoredMove[] {
	const { negamax } = createSearch({ weights, options });
	const moves = legalMoves(position);

	// Search best-capture-first so the narrowing window bites sooner, but report the moves in
	// generated order regardless: the policy's tie-break picks by index, so a caller must see the
	// same order whether or not the search pruned.
	const order = prune ? orderMoves({ position, moves }) : moves;
	const scoreByMove = new Map<NormalMove, number>();
	let best = -INFINITY;

	for (const move of order) {
		const score = -negamax({
			position: afterMove({ position, move }),
			played: { parent: position, move },
			depth: options.depth - 1,
			alpha: -INFINITY,
			beta: prune ? -best : INFINITY,
		});

		scoreByMove.set(move, score);
		if (score > best) best = score;
	}

	return moves.map((move) => ({ move, score: scoreByMove.get(move)! }));
}
