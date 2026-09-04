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

// Most valuable victim, least valuable attacker: take the queen with the pawn before the pawn
// with the queen. Alpha-beta prunes far more when the good move comes first, so this is worth
// more than it costs — but only for captures, since ordering quiet moves needs history the
// search does not keep.
function priority({ position, move }: { position: Chess; move: NormalMove }): number {
	const victim = position.board.getRole(move.to);
	if (victim === undefined) return move.promotion ? 1 : 0;

	const attacker = position.board.getRole(move.from) ?? "king";

	return 100 + WORTH[victim] * 10 - WORTH[attacker];
}

// Insertion sort over one copy of the list, rather than a `{ move, priority }` object per move
// and two more arrays around a comparator sort. Priorities are never negative, so a quiet move
// can never move left and is skipped outright: a position with no captures — most of them — costs
// one pass and no shuffling at all, and the handful that do cost a shift past the quiet moves
// they overtake. Equal priorities keep their generated order, as the comparator sort did.
export function orderMoves({
	position,
	moves,
}: {
	position: Chess;
	moves: NormalMove[];
}): NormalMove[] {
	const ordered = moves.slice();
	const priorities: number[] = [];
	for (const move of ordered) priorities.push(priority({ position, move }));

	for (let index = 1; index < ordered.length; index += 1) {
		const move = ordered[index];
		const value = priorities[index];
		if (value === 0) continue;

		let slot = index - 1;
		while (slot >= 0 && priorities[slot] < value) {
			ordered[slot + 1] = ordered[slot];
			priorities[slot + 1] = priorities[slot];
			slot -= 1;
		}

		ordered[slot + 1] = move;
		priorities[slot + 1] = value;
	}

	return ordered;
}
