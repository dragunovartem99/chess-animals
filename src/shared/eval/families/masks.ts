import { SquareSet } from "chessops/squareSet";
import type { Color } from "chessops/types";
import { squareFile, squareRank } from "chessops/util";

export const FILES = Array.from({ length: 8 }, (_, file) => SquareSet.fromFile(file));

export const RANKS = Array.from({ length: 8 }, (_, rank) => SquareSet.fromRank(rank));

export const ADJACENT_FILES = FILES.map((_, file) => {
	let mask = SquareSet.empty();

	if (file > 0) mask = mask.union(FILES[file - 1]);
	if (file < 7) mask = mask.union(FILES[file + 1]);

	return mask;
});

// Ranks strictly ahead of `rank`, from `color`'s point of view.
function ahead({ color, rank }: { color: Color; rank: number }): SquareSet {
	let mask = SquareSet.empty();
	const range =
		color === "white"
			? Array.from({ length: 7 - rank }, (_, offset) => rank + 1 + offset)
			: Array.from({ length: rank }, (_, offset) => offset);

	for (const index of range) mask = mask.union(RANKS[index]);

	return mask;
}

// Everything in front of a square on its own file — what a doubled pawn sits in.
export function frontSpan({ color, square }: { color: Color; square: number }): SquareSet {
	return ahead({ color, rank: squareRank(square) }).intersect(FILES[squareFile(square)]);
}

// Everything in front of a square on its own and both neighbouring files. Empty of enemy pawns
// is exactly the definition of a passed pawn.
export function passedSpan({ color, square }: { color: Color; square: number }): SquareSet {
	const file = squareFile(square);

	return ahead({ color, rank: squareRank(square) }).intersect(
		FILES[file].union(ADJACENT_FILES[file])
	);
}

// The rank a square sits on, counted from `color`'s own back rank.
export function relativeRank({ color, square }: { color: Color; square: number }): number {
	const rank = squareRank(square);

	return color === "white" ? rank : 7 - rank;
}

// King-move distance: the number of steps a king needs between two squares. It is the metric the
// Elo World strategies are written in, and the one an endgame king is judged by.
export function chebyshev({ from, to }: { from: number; to: number }): number {
	return Math.max(
		Math.abs(squareFile(from) - squareFile(to)),
		Math.abs(squareRank(from) - squareRank(to))
	);
}
