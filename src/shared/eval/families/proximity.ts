import type { Color, Role } from "chessops/types";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";
import { chebyshev } from "./masks";

const SWARM = featureId("swarm");
const HUDDLE = featureId("huddle");
const KING_PROXIMITY = featureId("kingProximity");
const REVERSE_STARTING = featureId("reverseStarting");

// Where a side's pieces stand in the *opponent's* opening position — the squares `reverseStarting`
// is trying to reach. Files are the standard back rank; pawns want the enemy's second rank.
function homeSquares({ role, color }: { role: Role; color: Color }): number[] {
	const backRank = color === "white" ? 7 : 0;
	const pawnRank = color === "white" ? 6 : 1;
	const files: Partial<Record<Role, number[]>> = {
		rook: [0, 7],
		knight: [1, 6],
		bishop: [2, 5],
		queen: [3],
		king: [4],
	};

	if (role === "pawn") return Array.from({ length: 8 }, (_, file) => pawnRank * 8 + file);

	return (files[role] ?? []).map((file) => backRank * 8 + file);
}

function sumDistance({
	context,
	color,
	target,
}: {
	context: EvalContext;
	color: Color;
	target: number;
}): number {
	let total = 0;

	for (const square of context.position.board[color])
		total += chebyshev({ from: square, to: target });

	return total;
}

// How far a side's pieces are from where they would stand if the board were upside down.
function reverseDistance({ context, color }: { context: EvalContext; color: Color }): number {
	let total = 0;

	for (const [square, piece] of context.position.board) {
		if (piece.color !== color) continue;

		const targets = homeSquares({ role: piece.role, color });
		if (targets.length === 0) continue;

		total += Math.min(...targets.map((target) => chebyshev({ from: square, to: target })));
	}

	return total;
}

// The distance strategies, all measured in king moves. `swarm` charges the enemy king with
// everything, `huddle` builds a wall around its own, and `reverseStarting` walks the whole army
// into the opponent's opening position. Each is one weight away from being a bot.
export function extractProximity({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	const { board } = context.position;
	const ourKing = board.kingOf(context.us);
	const theirKing = board.kingOf(context.them);
	if (ourKing === undefined || theirKing === undefined) return;

	features[SWARM] =
		sumDistance({ context, color: context.us, target: theirKing }) -
		sumDistance({ context, color: context.them, target: ourKing });

	features[HUDDLE] =
		sumDistance({ context, color: context.us, target: ourKing }) -
		sumDistance({ context, color: context.them, target: theirKing });

	// The two kings are the same distance apart from either side's point of view, so this one is
	// a raw value rather than a difference — there is nothing to subtract.
	features[KING_PROXIMITY] = chebyshev({ from: ourKing, to: theirKing });

	features[REVERSE_STARTING] =
		reverseDistance({ context, color: context.us }) -
		reverseDistance({ context, color: context.them });
}
