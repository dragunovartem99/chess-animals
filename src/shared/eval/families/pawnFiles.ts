import type { SquareSet } from "chessops/squareSet";
import type { Color } from "chessops/types";

// A per-file summary of one side's pawns, read from that side's own point of view: how many stand
// on each file, and how far the most and least advanced of them have got.
//
// Every pawn trait except the shield falls out of these three arrays, so the whole family costs
// one pass over the pawns plus constant work per pawn — no bitboard allocation in the inner loop.
export type PawnFiles = {
	counts: number[];
	furthest: number[];
	nearest: number[];
};

const NONE = -1;
const BEYOND = 8;

export function summariseFiles({ pawns, color }: { pawns: SquareSet; color: Color }): PawnFiles {
	const counts = [0, 0, 0, 0, 0, 0, 0, 0];
	const furthest = [NONE, NONE, NONE, NONE, NONE, NONE, NONE, NONE];
	const nearest = [BEYOND, BEYOND, BEYOND, BEYOND, BEYOND, BEYOND, BEYOND, BEYOND];
	const white = color === "white";

	for (const square of pawns) {
		const file = square & 7;
		const rank = white ? square >> 3 : 7 - (square >> 3);

		counts[file] += 1;
		if (rank > furthest[file]) furthest[file] = rank;
		if (rank < nearest[file]) nearest[file] = rank;
	}

	return { counts, furthest, nearest };
}

// The enemy's files summarised from *our* point of view, which is what a passed pawn is judged
// against: an enemy pawn "ahead of" ours is one with a higher rank on our scale.
export function summariseAgainst({ pawns, color }: { pawns: SquareSet; color: Color }): number[] {
	const furthest = [NONE, NONE, NONE, NONE, NONE, NONE, NONE, NONE];
	const white = color === "white";

	for (const square of pawns) {
		const file = square & 7;
		const rank = white ? square >> 3 : 7 - (square >> 3);

		if (rank > furthest[file]) furthest[file] = rank;
	}

	return furthest;
}

export { BEYOND, NONE };
