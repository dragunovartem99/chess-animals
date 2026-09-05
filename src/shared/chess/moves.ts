import { attacks } from "chessops/attacks";
import type { Chess } from "chessops/chess";
import type { SquareSet } from "chessops/squareSet";
import type { NormalMove, Role, Square } from "chessops/types";
import { opposite } from "chessops/util";

// Every role a pawn may become. Ordered best-first, so move ordering gets queens early.
const PROMOTION_ROLES: Role[] = ["queen", "knight", "rook", "bishop"];

// The moves one piece makes, promotions expanded into one move per role. `promotionRank` is the
// only rank this piece could promote on, or `-1` when it is not a pawn — so the inner loop is a
// comparison rather than a board lookup per destination.
//
// The walk over `dests` is the bit loop that a `SquareSet`'s `for..of` wraps in a generator: this
// is the hot loop of every search, and the generator's iterator object and `{ value, done }` per
// square measured a fifth of the move generator's time. A callback form costs more than it saves
// — the closure is allocated per piece — so the two halves of the board are spelled out.
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

// Every legal move, promotions expanded into one move per role. `targets` narrows the
// destinations to a mask; quiescence passes the enemy men so the quiet moves that make up the
// bulk of a position are never built at all.
//
// Walked piece by piece rather than through `allDests`, which builds a `Map` of one `SquareSet`
// per piece that this throws away immediately. Whether a piece is a pawn is one bitboard test
// rather than `getRole`, which scans all six role sets before it finds one.
function generate({ position, targets }: { position: Chess; targets?: SquareSet }): NormalMove[] {
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

			// A piece that attacks nothing worth taking cannot produce a capture, and asking for
			// its legal moves — pins, checks, and for a king a safety test per destination — is
			// the expensive half of generating them. Quiescence skips it for most of the board.
			if (targets !== undefined) {
				const piece = { role: board.getRole(from) ?? "king", color: position.turn };
				if (attacks(piece, from, board.occupied).intersect(targets).isEmpty()) continue;
			}

			const dests = position.dests(from, context);

			expand({
				from,
				dests: targets ? dests.intersect(targets) : dests,
				promotionRank: board.pawn.has(from) ? lastRank : -1,
				moves,
			});
		}
	}

	return moves;
}

export function legalMoves(position: Chess): NormalMove[] {
	return generate({ position });
}

// Legal captures only — the moves quiescence searches. En passant is left out, which quiescence
// has always done since it filtered on the target square being occupied.
export function legalCaptures(position: Chess): NormalMove[] {
	return generate({ position, targets: position.board[opposite(position.turn)] });
}
