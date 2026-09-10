import { squareFile, squareRank } from "chessops/util";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";
import { relativeRank } from "./masks";

const CENTRALIZATION = featureId("centralization");
const DEVELOPMENT = featureId("development");

export const SLOTS = [CENTRALIZATION, DEVELOPMENT];

// 0 on the rim, 6 on one of the four central squares. Cheaper than a table and, unlike one,
// tunable with a single number.
function centrality(square: number): number {
	const file = squareFile(square);
	const rank = squareRank(square);

	return Math.min(file, 7 - file) + Math.min(rank, 7 - rank);
}

// A strategic stand-in for a piece-square table in one number, not sixty-four and not the twelve
// per-role sliders this replaced: how far the pieces stand from the rim, king and pawns excluded —
// the king wants safety, and the pawn's own `advancement` term went with the rest of the pawn
// family when the lab rated every pawn-structure weight at or below bare material. It is the
// side-to-move's total minus the opponent's, so it reads the same from either seat.
export function extractPlacement({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	const { board } = context.position;
	let central = 0;
	let developed = 0;

	for (const color of [context.us, context.them]) {
		const sign = color === context.us ? 1 : -1;

		for (const role of ["knight", "bishop", "rook", "queen"] as const) {
			for (const square of board.pieces(color, role)) central += sign * centrality(square);
		}

		// A minor counts as developed once it has left its own back rank — a plain count, no read
		// on whether the square is any good, which `centralization` beside it already supplies.
		for (const role of ["knight", "bishop"] as const) {
			for (const square of board.pieces(color, role)) {
				if (relativeRank({ color, square }) > 0) developed += sign;
			}
		}
	}

	features[CENTRALIZATION] = central;
	features[DEVELOPMENT] = developed;
}
