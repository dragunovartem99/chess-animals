import type { Chess } from "chessops/chess";
import { ROLES } from "chessops/types";
import type { Color, Role } from "chessops/types";

import { afterMove, positionFromFen } from "../chess";
import { fromUci } from "../engine/uci/moves";

// What a move did: the piece it took, whether it gave check, and the material on the board after
// it, White's minus Black's, in pawns — and again once the observer's reply to it is played, so a
// piece taken into a recapture is seen to net nothing.
export type Facts = { captured?: Role; check: boolean; material: number; settled: number };

// The count everyone knows rather than an engine's, since a remark is about what was taken and
// the king is never taken.
export const VALUES: Record<Role, number> = {
	pawn: 1,
	knight: 3,
	bishop: 3,
	rook: 5,
	queen: 9,
	king: 0,
};

// A game on `/play` starts from the opening position, so White makes the odd plies.
export const moverOf = (ply: number): Color => (ply % 2 === 1 ? "white" : "black");

const materialOf = ({ board }: Chess): number =>
	ROLES.reduce((sum, role) => {
		const pieces = board.pieces("white", role).size() - board.pieces("black", role).size();
		return sum + VALUES[role] * pieces;
	}, 0);

// The material after `reply`, if it is one, in `position`.
function settle({ position, reply }: { position: Chess; reply: string | undefined }): number {
	const move = reply === undefined ? undefined : fromUci({ position, uci: reply });

	return materialOf(move ? afterMove({ position, move }) : position);
}

// The facts of `uci` played from `fen`, answered by `reply`. En passant takes a pawn from a square
// the move does not land on, and castling lands on a rook of the mover's own, which is not a
// capture.
export function moveFacts({
	fen,
	uci,
	reply,
}: {
	fen: string;
	uci: string;
	reply?: string;
}): Facts {
	const position = positionFromFen(fen);
	const move = fromUci({ position, uci });
	if (!move) {
		const material = materialOf(position);
		return { check: false, material, settled: material };
	}

	const target = position.board.get(move.to);
	const passant = move.to === position.epSquare && position.board.getRole(move.from) === "pawn";
	const captured =
		target && target.color !== position.turn ? target.role : passant ? "pawn" : undefined;
	const after = afterMove({ position, move });
	const facts = {
		check: after.isCheck(),
		material: materialOf(after),
		settled: settle({ position: after, reply }),
	};

	return captured ? { captured, ...facts } : facts;
}
