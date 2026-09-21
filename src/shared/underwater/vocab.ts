import type { NormalMove, Role } from "chessops/types";

// The size of Maia's move space: every from-to pair of squares, then every promotion.
export const MOVE_COUNT = 4352;

// Maia's own order, not chessops's: the index of a promotion depends on it.
const PROMOTIONS: Role[] = ["queen", "rook", "bishop", "knight"];

// Where a move sits among Maia's logits, read off the board Maia sees — White to move, castling as
// the square the king lands on. A formula rather than the 4352-entry table the Maia frontend ships:
// the first 4096 are `from * 64 + to`, and the 256 after them are each rank-7 square to each
// rank-8 square, four roles apiece.
export function moveIndex({ from, to, promotion }: NormalMove): number {
	if (promotion === undefined) return from * 64 + to;

	return 4096 + ((from & 7) * 8 + (to & 7)) * 4 + PROMOTIONS.indexOf(promotion);
}
