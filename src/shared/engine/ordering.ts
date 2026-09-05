import type { Board } from "chessops/board";
import type { Chess } from "chessops/chess";
import type { NormalMove, Role } from "chessops/types";

// Rough worth of a piece, for deciding which move to look at first. Nothing is scored with these
// — they only sort — so they are fixed rather than read from the tunable material weights.
const WORTH: Record<Role, number> = {
	pawn: 1,
	knight: 3,
	bishop: 3,
	rook: 5,
	queen: 9,
	king: 0,
};

// The priorities of the list being sorted, reused across calls rather than allocated per node.
// One buffer is enough because the sort runs to completion before the search recurses, and 256
// is above the 218 moves the most crowded legal position has.
const priorities = new Int32Array(256);

// Most valuable victim, least valuable attacker: take the queen with the pawn before the pawn
// with the queen. Alpha-beta prunes far more when the good move comes first, so this is worth
// more than it costs — but only for captures, since ordering quiet moves needs history the
// search does not keep.
//
// The occupancy test comes first because `getRole` scans all six role sets and only then reports
// an empty square — so the common case, a quiet move, was paying the most.
function priority({ board, move }: { board: Board; move: NormalMove }): number {
	if (!board.occupied.has(move.to)) return move.promotion ? 1 : 0;

	const victim = board.getRole(move.to) ?? "king";
	const attacker = board.getRole(move.from) ?? "king";

	return 100 + WORTH[victim] * 10 - WORTH[attacker];
}

// Sorts `moves` **in place** and returns it: every caller has just generated the list and owns
// it, and skipping the copy is one array less per node.
//
// Insertion sort, rather than a `{ move, priority }` object per move and two more arrays around a
// comparator sort. Priorities are never negative, so a quiet move can never move left and is
// skipped outright: a position with no captures — most of them — costs one pass and no shuffling
// at all, and the handful that do cost a shift past the quiet moves they overtake. Equal
// priorities keep their generated order, as the comparator sort did.
export function orderMoves({
	position,
	moves,
}: {
	position: Chess;
	moves: NormalMove[];
}): NormalMove[] {
	const { board } = position;
	for (let index = 0; index < moves.length; index += 1) {
		priorities[index] = priority({ board, move: moves[index] });
	}

	for (let index = 1; index < moves.length; index += 1) {
		const move = moves[index];
		const value = priorities[index];
		if (value === 0) continue;

		let slot = index - 1;
		while (slot >= 0 && priorities[slot] < value) {
			moves[slot + 1] = moves[slot];
			priorities[slot + 1] = priorities[slot];
			slot -= 1;
		}

		moves[slot + 1] = move;
		priorities[slot + 1] = value;
	}

	return moves;
}
