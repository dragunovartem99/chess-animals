import { pawnAttacks } from "chessops/attacks";
import type { SquareSet } from "chessops/squareSet";
import type { Color } from "chessops/types";
import { opposite, squareFile, squareRank } from "chessops/util";

import type { EvalContext } from "./context";
import { ADJACENT_FILES, FILES, RANKS, relativeRank } from "./masks";

// Contiguous runs of occupied files. Two islands are harder to hold than one chain of the same
// size, whoever owns more pawns.
export function countIslands(ours: SquareSet): number {
	let islands = 0;
	let previous = false;

	for (const file of FILES) {
		const occupied = ours.intersects(file);
		if (occupied && !previous) islands += 1;
		previous = occupied;
	}

	return islands;
}

// A pawn that no neighbour can drop back to defend, and whose advance square an enemy pawn
// covers — it can neither be helped nor go forward.
export function isBackward({
	context,
	color,
	square,
}: {
	context: EvalContext;
	color: Color;
	square: number;
}): boolean {
	const ours = context.position.board.pieces(color, "pawn");
	const rank = relativeRank({ color, square });

	for (const neighbour of ours.intersect(ADJACENT_FILES[squareFile(square)])) {
		if (relativeRank({ color, square: neighbour }) <= rank) return false;
	}

	const advance = square + (color === "white" ? 8 : -8);

	return advance >= 0 && advance < 64 && context.pawnAttacks[opposite(color)].has(advance);
}

// Defended from behind, or standing shoulder to shoulder. Both make a pawn expensive to win.
export function isConnected({
	ours,
	color,
	square,
}: {
	ours: SquareSet;
	color: Color;
	square: number;
}): boolean {
	const defenders = ours.intersect(pawnAttacks(opposite(color), square));
	const phalanx = ours
		.intersect(ADJACENT_FILES[squareFile(square)])
		.intersect(RANKS[squareRank(square)]);

	return defenders.nonEmpty() || phalanx.nonEmpty();
}

// Own pawns standing on the king's file and its neighbours, one or two ranks in front of him.
export function countShield({
	ours,
	king,
	color,
}: {
	ours: SquareSet;
	king: number;
	color: Color;
}): number {
	const file = squareFile(king);
	const near = FILES[file].union(ADJACENT_FILES[file]);
	const kingRank = relativeRank({ color, square: king });

	let shield = 0;
	for (const square of ours.intersect(near)) {
		const distance = relativeRank({ color, square }) - kingRank;
		if (distance === 1 || distance === 2) shield += 1;
	}

	return shield;
}
