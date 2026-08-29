import type { SquareSet } from "chessops/squareSet";
import type { Color } from "chessops/types";

// Own pawns standing on the king's file and its neighbours, one or two ranks in front of him.
//
// Walked by square index rather than through bitboard masks: there are at most six squares to
// look at, and building the mask cost more than checking all six.
export function countShield({
	ours,
	king,
	color,
}: {
	ours: SquareSet;
	king: number;
	color: Color;
}): number {
	const file = king & 7;
	const step = color === "white" ? 8 : -8;

	let shield = 0;

	for (let ahead = 1; ahead <= 2; ahead += 1) {
		const rankStart = king + step * ahead;
		if (rankStart < 0 || rankStart > 63) continue;

		for (let offset = -1; offset <= 1; offset += 1) {
			const neighbour = file + offset;
			if (neighbour < 0 || neighbour > 7) continue;
			if (ours.has(rankStart + offset)) shield += 1;
		}
	}

	return shield;
}
