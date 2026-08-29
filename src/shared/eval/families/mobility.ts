import { attacks } from "chessops/attacks";
import type { Color, Role } from "chessops/types";
import { opposite } from "chessops/util";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";

const MOBILITY = featureId("mobility");
const SAFE_MOBILITY = featureId("safeMobility");

// Pawns and the king are left out: a pawn's moves are structure, not activity, and counting the
// king's would reward walking it into the open — which is a personality, not an evaluation, and
// `kingProximity` offers it deliberately.
const MOBILE_ROLES: Role[] = ["knight", "bishop", "rook", "queen"];

type Counts = { total: number; safe: number };

// Destination squares, not legal moves: pins are not resolved here. Counting attacks costs one
// bitboard operation per piece, and the search sees a pinned move disappear anyway.
function countMoves({ context, color }: { context: EvalContext; color: Color }): Counts {
	const { board } = context.position;
	const own = board[color];
	const attackedByTheirPawns = context.pawnAttacks[opposite(color)];

	let total = 0;
	let safe = 0;

	for (const role of MOBILE_ROLES) {
		for (const square of board.pieces(color, role)) {
			const reachable = attacks({ color, role }, square, board.occupied).diff(own);

			total += reachable.size();
			safe += reachable.diff(attackedByTheirPawns).size();
		}
	}

	return { total, safe };
}

// Squares a side's pieces can go to, and how many of those a pawn cannot take them on. Both are
// differences from the side to move's point of view.
export function extractMobility({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	const ours = countMoves({ context, color: context.us });
	const theirs = countMoves({ context, color: context.them });

	features[MOBILITY] = ours.total - theirs.total;
	features[SAFE_MOBILITY] = ours.safe - theirs.safe;
}
