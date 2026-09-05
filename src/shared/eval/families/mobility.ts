import type { Color, Role } from "chessops/types";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";

const MOBILITY = featureId("mobility");

export const SLOTS = [MOBILITY];

// Pawns and the king are left out: a pawn's moves are structure, not activity, and counting the
// king's would reward walking it into the open — which is a personality, not an evaluation, and
// `kingProximity` offers it deliberately.
const MOBILE_ROLES = new Set<Role>(["knight", "bishop", "rook", "queen"]);

// Destination squares, not legal moves: pins are not resolved here. The attack sets come from the
// context's single board walk, so this costs a couple of bitboard operations per piece.
function countMoves({ context, color }: { context: EvalContext; color: Color }): number {
	const own = context.position.board[color];

	let total = 0;

	for (const { piece, reach } of context.reach) {
		if (piece.color !== color || !MOBILE_ROLES.has(piece.role)) continue;
		total += reach.diff(own).size();
	}

	return total;
}

// Squares a side's pieces can go to, as a difference from the side to move's point of view. The
// `safeMobility` refinement this once carried — moves a pawn cannot take — read nothing at depth
// 2 that `mobility` and `hanging` did not already say, and no animal ever priced it apart.
export function extractMobility({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	features[MOBILITY] =
		countMoves({ context, color: context.us }) - countMoves({ context, color: context.them });
}
