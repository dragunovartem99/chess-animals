import type { SquareSet } from "chessops/squareSet";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";

// Kings are not counted: both sides always have exactly one, so the difference is always zero.
const PAWN = featureId("materialPawn");
const KNIGHT = featureId("materialKnight");
const BISHOP = featureId("materialBishop");
const ROOK = featureId("materialRook");
const QUEEN = featureId("materialQueen");

export const SLOTS = [PAWN, KNIGHT, BISHOP, ROOK, QUEEN];

const popcount = (bits: number): number => {
	let n = bits - ((bits >>> 1) & 0x55555555);
	n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
	return Math.imul((n + (n >>> 4)) & 0x0f0f0f0f, 0x01010101) >> 24;
};

// How many men of one role one side has. `board.pieces(color, role)` answers the same thing but
// allocates a `SquareSet` for the intersection, and this is called ten times a node on the
// hottest path in the engine — so the two halves of the bitboard are counted where they lie.
function count({ pieces, side }: { pieces: SquareSet; side: SquareSet }): number {
	return popcount(pieces.lo & side.lo) + popcount(pieces.hi & side.hi);
}

// The count difference per role, so the weight *is* the piece value. A bot that values a knight
// above a rook is one number away, which is the point.
//
// Written out a role at a time rather than looped over a table: `board[role]` with a string that
// varies is a dictionary lookup, while the five named fields are direct.
export function extractMaterial({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	const { board } = context.position;
	const us = board[context.us];
	const them = board[context.them];

	features[PAWN] =
		count({ pieces: board.pawn, side: us }) - count({ pieces: board.pawn, side: them });
	features[KNIGHT] =
		count({ pieces: board.knight, side: us }) - count({ pieces: board.knight, side: them });
	features[BISHOP] =
		count({ pieces: board.bishop, side: us }) - count({ pieces: board.bishop, side: them });
	features[ROOK] =
		count({ pieces: board.rook, side: us }) - count({ pieces: board.rook, side: them });
	features[QUEEN] =
		count({ pieces: board.queen, side: us }) - count({ pieces: board.queen, side: them });
}
