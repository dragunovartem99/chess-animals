import type { NormalMove } from "chessops/types";

// What one search remembers about the quiet moves that refuted a line, so a sibling tries them
// first. Captures are already ordered by what they take; a quiet move has nothing on the board to
// rank it by, and before this every one of them was searched in generated order.
//
// Two killers per ply — the last two quiet moves that caused a cutoff at that distance from the
// root, which in a sibling position are usually still legal and still good — and a history score
// per from→to, for the rest. Held per search and never across one: a table that outlived its
// search would make a move depend on which games the worker happened to play before it, and the
// arena's result cache rests on a game being a pure function of its spec.
export type Cutoffs = { killers: Int32Array; history: Int32Array };

// Deeper than any line a search here reaches: depth 3 plus the quiescence tail.
const MAX_PLY = 64;

export const moveCode = (move: NormalMove): number => move.from * 64 + move.to;

export function createCutoffs(): Cutoffs {
	return { killers: new Int32Array(MAX_PLY * 2).fill(-1), history: new Int32Array(64 * 64) };
}

// Where a quiet move sorts, below every capture (100 and up). The killers outrank history; a
// history score is bucketed by its bit length, so a move that refuted one deep line and one that
// refuted a hundred shallow ones still come out in a sensible order without a comparator sort.
export function quietPriority({
	cutoffs,
	move,
	ply,
}: {
	cutoffs: Cutoffs;
	move: NormalMove;
	ply: number;
}): number {
	const code = moveCode(move);
	if (code === cutoffs.killers[ply * 2]) return 51;
	if (code === cutoffs.killers[ply * 2 + 1]) return 50;

	return Math.min(49, 32 - Math.clz32(cutoffs.history[code]));
}

// Called on a beta cutoff by a quiet move. Weighted by the remaining depth squared, the usual
// shape: a refutation high in the tree pruned far more than one at the leaves.
export function recordCutoff({
	cutoffs,
	move,
	ply,
	depth,
}: {
	cutoffs: Cutoffs;
	move: NormalMove;
	ply: number;
	depth: number;
}): void {
	const code = moveCode(move);
	cutoffs.history[code] += depth * depth;
	if (cutoffs.killers[ply * 2] === code) return;

	cutoffs.killers[ply * 2 + 1] = cutoffs.killers[ply * 2];
	cutoffs.killers[ply * 2] = code;
}
