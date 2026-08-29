import type { Chess } from "chessops/chess";
import type { Role } from "chessops/types";

// Non-pawn material, counted the usual tapered-eval way: the full opening board is 24 and bare
// kings are 0. Pawns are excluded because they leave the board last and would keep every long
// game reading as a middlegame.
const PHASE_WEIGHTS: Partial<Record<Role, number>> = {
	knight: 1,
	bishop: 1,
	rook: 2,
	queen: 4,
};

const OPENING_MATERIAL = 24;

// Where the game sits on the opening → endgame axis, as `0` (full material) to `1` (bare kings).
// Weight sets are interpolated along it rather than switched between, so a single capture never
// makes the evaluation jump.
export function gamePhase(position: Chess): number {
	let material = 0;

	for (const [role, weight] of Object.entries(PHASE_WEIGHTS)) {
		material += position.board[role as Role].size() * weight;
	}

	return 1 - Math.min(material, OPENING_MATERIAL) / OPENING_MATERIAL;
}
