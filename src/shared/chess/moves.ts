import type { Chess } from "chessops/chess";
import type { SquareSet } from "chessops/squareSet";
import type { NormalMove, Role, Square } from "chessops/types";

// Every role a pawn may become, in chessops's order.
const PROMOTION_ROLES: Role[] = ["queen", "knight", "rook", "bishop"];

// The moves one piece makes, promotions expanded into one move per role. `promotionRank` is the
// only rank this piece could promote on, or `-1` when it is not a pawn — so the inner loop is a
// comparison rather than a board lookup per destination.
//
// The walk over `dests` is the bit loop that a `SquareSet`'s `for..of` wraps in a generator,
// spelled out over the two halves of the board. The order it yields is the one the engine's move
// generator is held to through `moves.txt`, so it is not free to change.
function expand({
	from,
	dests,
	promotionRank,
	moves,
}: {
	from: Square;
	dests: SquareSet;
	promotionRank: number;
	moves: NormalMove[];
}): void {
	for (let bits = dests.lo; bits !== 0; bits &= bits - 1) {
		push({ from, to: 31 - Math.clz32(bits & -bits), promotionRank, moves });
	}

	for (let bits = dests.hi; bits !== 0; bits &= bits - 1) {
		push({ from, to: 63 - Math.clz32(bits & -bits), promotionRank, moves });
	}
}

function push({
	from,
	to,
	promotionRank,
	moves,
}: {
	from: Square;
	to: Square;
	promotionRank: number;
	moves: NormalMove[];
}): void {
	if (to >> 3 === promotionRank) {
		for (const promotion of PROMOTION_ROLES) moves.push({ from, to, promotion });
	} else {
		moves.push({ from, to });
	}
}

// Every legal move, promotions expanded into one move per role: from-square ascending, then
// to-square ascending, promotions as Q N R B. Walked piece by piece rather than through
// `allDests`, which builds a `Map` of one `SquareSet` per piece only to throw it away.
export function legalMoves(position: Chess): NormalMove[] {
	const context = position.ctx();
	const { board } = position;
	const lastRank = position.turn === "white" ? 7 : 0;
	const moves: NormalMove[] = [];
	const ours = board[position.turn];

	for (let half = 0; half < 2; half += 1) {
		let bits = half === 0 ? ours.lo : ours.hi;

		while (bits !== 0) {
			const from = (half << 5) + 31 - Math.clz32(bits & -bits);
			bits &= bits - 1;

			expand({
				from,
				dests: position.dests(from, context),
				promotionRank: board.pawn.has(from) ? lastRank : -1,
				moves,
			});
		}
	}

	return moves;
}
