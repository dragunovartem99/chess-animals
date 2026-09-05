import { squareFile, squareRank } from "chessops/util";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";

const CENTRALIZATION = featureId("centralization");
const ADVANCEMENT = featureId("advancement");

export const SLOTS = [CENTRALIZATION, ADVANCEMENT];

// 0 on the rim, 6 on one of the four central squares. Cheaper than a table and, unlike one,
// tunable with a single number.
function centrality(square: number): number {
	const file = squareFile(square);
	const rank = squareRank(square);

	return Math.min(file, 7 - file) + Math.min(rank, 7 - rank);
}

// A strategic stand-in for a piece-square table in two numbers, not sixty-four and not the twelve
// per-role sliders this replaced: `centralization` is how far the pieces stand from the rim (the
// king and pawns excluded — the king wants safety, the pawn has its own term), `advancement` is
// how far the pawns have walked from their own back rank. Both are the side-to-move's total minus
// the opponent's, so they read the same from either seat.
export function extractPlacement({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	const { board } = context.position;
	let central = 0;
	let advanced = 0;

	for (const color of [context.us, context.them]) {
		const sign = color === context.us ? 1 : -1;
		const white = color === "white";

		for (const square of board.pieces(color, "pawn")) {
			advanced += sign * (white ? square >> 3 : 7 - (square >> 3));
		}
		for (const role of ["knight", "bishop", "rook", "queen"] as const) {
			for (const square of board.pieces(color, role)) central += sign * centrality(square);
		}
	}

	features[CENTRALIZATION] = central;
	features[ADVANCEMENT] = advanced;
}
