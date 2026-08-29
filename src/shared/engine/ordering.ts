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

export function orderMoves({
	position,
	moves,
}: {
	position: Chess;
	moves: NormalMove[];
}): NormalMove[] {
	return moves
		.map((move) => ({ move, priority: priority({ position, move }) }))
		.toSorted((left, right) => right.priority - left.priority)
		.map((entry) => entry.move);
}
