import type { Role } from "chessops/types";

import { afterMove, positionFromFen } from "../chess";
import { fromUci } from "../engine/uci/moves";

// What a move did that anyone watching could see: the piece it took, and whether it gave check.
export type Facts = { captured?: Role; check: boolean };

// The facts of `uci` played from `fen`. En passant takes a pawn from a square the move does not
// land on, and castling lands on a rook of the mover's own, which is not a capture.
export function moveFacts({ fen, uci }: { fen: string; uci: string }): Facts {
	const position = positionFromFen(fen);
	const move = fromUci({ position, uci });
	if (!move) return { check: false };

	const target = position.board.get(move.to);
	const passant = move.to === position.epSquare && position.board.getRole(move.from) === "pawn";
	const captured =
		target && target.color !== position.turn ? target.role : passant ? "pawn" : undefined;
	const check = afterMove({ position, move }).isCheck();

	return captured ? { captured, check } : { check };
}
