import type { SquareSet } from "chessops/squareSet";

import type { PawnFiles } from "./pawnFiles";

// A pawn that no neighbour can drop back to defend, and whose advance square an enemy pawn
// covers — it can neither be helped nor go forward.
export function isBackward({
	ours,
	file,
	rank,
	advanceCovered,
}: {
	ours: PawnFiles;
	file: number;
	rank: number;
	advanceCovered: boolean;
}): boolean {
	if (!advanceCovered) return false;
	if (file > 0 && ours.nearest[file - 1] <= rank) return false;
	if (file < 7 && ours.nearest[file + 1] <= rank) return false;

	return true;
}

// Nothing of theirs ahead on this file or either neighbour, and none of ours in the way.
export function isPassed({
	ours,
	theirs,
	file,
	rank,
}: {
	ours: PawnFiles;
	theirs: number[];
	file: number;
	rank: number;
}): boolean {
	if (ours.furthest[file] > rank) return false;
	if (theirs[file] > rank) return false;
	if (file > 0 && theirs[file - 1] > rank) return false;
	if (file < 7 && theirs[file + 1] > rank) return false;

	return true;
}

// Defended from behind, or standing shoulder to shoulder. Both make a pawn expensive to win, and
// both are a neighbouring pawn either level with this one or one rank below it.
export function isConnected({
	pawns,
	square,
	file,
	step,
}: {
	pawns: SquareSet;
	square: number;
	file: number;
	step: number;
}): boolean {
	if (file > 0 && (pawns.has(square - 1) || pawns.has(square - 1 - step))) return true;

	return file < 7 && (pawns.has(square + 1) || pawns.has(square + 1 - step));
}
