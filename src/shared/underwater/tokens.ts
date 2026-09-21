import type { Chess } from "chessops/chess";
import type { Role } from "chessops/types";

const ROLES: Role[] = ["pawn", "knight", "bishop", "rook", "queen", "king"];

// The board as Maia reads it: 64 squares of 12 channels, the side to move's six roles first. Maia
// only ever sees White to move, so a position with Black to move is flipped top to bottom and its
// colours swapped — which is why the channels are "ours" and "theirs" here, not white and black.
export function boardTokens(position: Chess): Float32Array {
	const { board, turn } = position;
	const flip = turn === "black" ? 56 : 0;
	const tokens = new Float32Array(64 * 12);

	for (const square of board.occupied) {
		const piece = board.get(square);
		if (!piece) continue;

		const channel = ROLES.indexOf(piece.role) + (piece.color === turn ? 0 : 6);
		tokens[(square ^ flip) * 12 + channel] = 1;
	}

	return tokens;
}
