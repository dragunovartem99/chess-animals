import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { SquareSet } from "chessops/squareSet";
import { type Move, type NormalMove, type Role, type Square } from "chessops/types";
import { opposite } from "chessops/util";

// Every role a pawn may become. Ordered best-first, so move ordering gets queens early.
export const PROMOTION_ROLES: Role[] = ["queen", "knight", "rook", "bishop"];

// chessops reports a bad FEN as a bare code like `ERR_TURN`, which says nothing about which of
// the many FENs in a roster or opening file was wrong. Name it.
export function positionFromFen(fen: string): Chess {
	try {
		return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
	} catch (cause) {
		throw new Error(`invalid FEN "${fen}"`, { cause });
	}
}

export function fenFromPosition(position: Chess): string {
	return makeFen(position.toSetup());
}

// The identity a repetition claim is made on: board, side to move, castling rights and en
// passant file, with the move counters left out — chessops carries no history of its own, so
// the caller collects these keys as it plays and looks for the third copy.
export function repetitionKey(position: Chess): string {
	return makeFen(position.toSetup(), { epd: true });
}

// The moves one piece makes, promotions expanded into one move per role. Whether the piece is a
// pawn is settled once here rather than per destination, and `rank` is the only rank a pawn of
// this colour can promote on — so the inner loop is a comparison, not two board lookups.
function expand({
	from,
	dests,
	rank,
	moves,
}: {
	from: Square;
	dests: SquareSet;
	rank: number | undefined;
	moves: NormalMove[];
}): void {
	for (const to of dests) {
		if (rank !== undefined && to >> 3 === rank) {
			for (const promotion of PROMOTION_ROLES) moves.push({ from, to, promotion });
		} else {
			moves.push({ from, to });
		}
	}
}

// The rank a pawn on `from` would promote on, or `undefined` if this piece is not a pawn.
function promotionRank({ position, from }: { position: Chess; from: Square }): number | undefined {
	if (position.board.getRole(from) !== "pawn") return undefined;

	return position.turn === "white" ? 7 : 0;
}

// Whether the side to move has any legal move at all, short-circuiting on the first piece that
// has one — almost always the first piece looked at. `legalMoves(position).length === 0` answers
// the same question but builds the whole list first; at a search leaf, where all that matters is
// telling a mate or stalemate from a playable position, that list is never used.
export function hasLegalMove(position: Chess): boolean {
	const context = position.ctx();

	for (const from of position.board[position.turn]) {
		if (position.dests(from, context).nonEmpty()) return true;
	}

	return false;
}

// Every legal move, promotions expanded into one move per role. Walked piece by piece rather than
// through `allDests`, which builds a `Map` of one `SquareSet` per piece that this throws away
// immediately — the same shape `legalCaptures` has always had.
export function legalMoves(position: Chess): NormalMove[] {
	const context = position.ctx();
	const moves: NormalMove[] = [];

	for (const from of position.board[position.turn]) {
		const rank = promotionRank({ position, from });
		expand({ from, dests: position.dests(from, context), rank, moves });
	}

	return moves;
}

// Legal captures only — the moves quiescence searches. Generated straight from each of our
// pieces' legal destinations intersected with the enemy's men, so the quiet moves that make up
// the bulk of a position are never built at all. Promotions on a capture are expanded the same
// way `legalMoves` expands them; en passant is left out, which quiescence has always done since
// it filtered on the target square being occupied.
export function legalCaptures(position: Chess): NormalMove[] {
	const context = position.ctx();
	const enemies = position.board[opposite(position.turn)];
	const moves: NormalMove[] = [];

	for (const from of position.board[position.turn]) {
		const rank = promotionRank({ position, from });
		expand({ from, dests: position.dests(from, context).intersect(enemies), rank, moves });
	}

	return moves;
}

// Play a move on a copy, leaving the caller's position untouched.
export function afterMove({ position, move }: { position: Chess; move: Move }): Chess {
	const next = position.clone();
	next.play(move);
	return next;
}
