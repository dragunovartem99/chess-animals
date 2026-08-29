import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { type Move, type NormalMove, type Role, type Square } from "chessops/types";
import { squareRank } from "chessops/util";

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

function isPromotionMove({
	position,
	from,
	to,
}: {
	position: Chess;
	from: Square;
	to: Square;
}): boolean {
	if (position.board.getRole(from) !== "pawn") return false;

	const rank = squareRank(to);
	return position.turn === "white" ? rank === 7 : rank === 0;
}

// Every legal move, promotions expanded into one move per role.
export function legalMoves(position: Chess): NormalMove[] {
	const moves: NormalMove[] = [];

	for (const [from, dests] of position.allDests()) {
		for (const to of dests) {
			if (isPromotionMove({ position, from, to })) {
				for (const promotion of PROMOTION_ROLES) moves.push({ from, to, promotion });
			} else {
				moves.push({ from, to });
			}
		}
	}

	return moves;
}

// Play a move on a copy, leaving the caller's position untouched.
export function afterMove({ position, move }: { position: Chess; move: Move }): Chess {
	const next = position.clone();
	next.play(move);
	return next;
}
