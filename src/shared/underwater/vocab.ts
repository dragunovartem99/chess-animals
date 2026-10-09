import type { NormalMove, Role } from "chessops/types";

// The size of Maia's move space: every from-to pair of squares, then every promotion.
export const MOVE_COUNT = 4352;

// Maia's own order, not chessops's: the index of a promotion depends on it.
const PROMOTIONS: Role[] = ["queen", "rook", "bishop", "knight"];

// The logit index on the board Maia sees (White to move, castling to the king's square): `from * 64
// + to` for the first 4096, then rank-7 → rank-8 promotions, four roles each.
export function moveIndex({ from, to, promotion }: NormalMove): number {
	if (promotion === undefined) return from * 64 + to;

	return 4096 + ((from & 7) * 8 + (to & 7)) * 4 + PROMOTIONS.indexOf(promotion);
}
