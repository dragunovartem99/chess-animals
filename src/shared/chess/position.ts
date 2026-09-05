import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { Move } from "chessops/types";

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

// Play a move on a copy, leaving the caller's position untouched.
export function afterMove({ position, move }: { position: Chess; move: Move }): Chess {
	const next = position.clone();
	next.play(move);
	return next;
}
