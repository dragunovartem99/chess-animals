import type { Chess } from "chessops/chess";
import { ROLES } from "chessops/types";
import type { Color, NormalMove, Role } from "chessops/types";
import { opposite } from "chessops/util";

import { afterMove, positionFromFen } from "../chess";
import { fromUci } from "../engine/uci/moves";

// What a move did: whether it gave check, and whether it won a piece.
export type Facts = { check: boolean; won: boolean };

// A game on `/play` as far as it has gone: the position before every ply, the opening position
// first, and the moves played from them.
export type Played = { fens: readonly string[]; moves: readonly string[] };

// Pawns an exchange must net for the capturer to be remarked on. Two, not a minor piece's three:
// a knight given for a pawn, or a rook for a bishop, is a piece lost all the same, and it nets
// only two. A pawn, or a pawn and some position, does not clear it.
export const MATERIAL = 2;

// The count everyone knows rather than an engine's, since a remark is about what was taken and
// the king is never taken.
const VALUES: Record<Role, number> = {
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

type Ply = { position: Chess; move: NormalMove; captures: boolean };

// The move that made `ply`, and whether it took something. En passant takes a pawn from a square
// the move does not land on, and castling lands on a rook of the mover's own, which is not a
// capture.
function plyOf({ fens, moves, ply }: Played & { ply: number }): Ply | undefined {
	const fen = fens[ply - 1];
	const uci = moves[ply - 1];
	if (fen === undefined || uci === undefined) return undefined;

	const position = positionFromFen(fen);
	const move = fromUci({ position, uci });
	if (!move) return undefined;

	const target = position.board.get(move.to);
	const passant = move.to === position.epSquare && position.board.getRole(move.from) === "pawn";
	return { position, move, captures: target?.color === opposite(position.turn) || passant };
}

// Plies of the observer's line an exchange is settled over. One, the reply, is not enough: when a
// check in between scores as well as the recapture, the observer's reply may be the check, and a
// knight given for a bishop would look like a knight won. Three see the recapture behind it.
const SETTLE = 3;

// The material once the first `SETTLE` moves of the observer's `line` are played.
function settle({ after, line }: { after: Chess; line: readonly string[] }): number {
	let position = after;
	for (const uci of line.slice(0, SETTLE)) {
		const move = fromUci({ position, uci });
		if (!move) break;
		position = afterMove({ position, move });
	}

	return materialOf(position);
}

// The facts of `ply`, answered by the observer's `line`.
//
// A capture wins a piece when the run of captures it ends nets `MATERIAL`, judged on the board from
// before the run began to after the line is settled, rather than by a swing in the observer's score: the
// observer sees a fork or a pin a move or two ahead, so by the capture the gain is long priced in
// and swings nothing. The line is what tells a piece won from the first half of a trade. Read from
// the positions alone, so a verdict that never came for an earlier ply cannot silence this one.
export function moveFacts({
	fens,
	moves,
	ply,
	line = [],
}: Played & { ply: number; line?: readonly string[] }): Facts {
	const now = plyOf({ fens, moves, ply });
	if (!now) return { check: false, won: false };

	const after = afterMove(now);
	const check = after.isCheck();
	if (!now.captures) return { check, won: false };

	// Back to the position before the first capture of the run.
	let start = now.position;
	for (let at = ply - 1; at > 0; at -= 1) {
		const one = plyOf({ fens, moves, ply: at });
		if (!one?.captures) break;
		start = one.position;
	}
	const sign = now.position.turn === "white" ? 1 : -1;
	return { check, won: sign * (settle({ after, line }) - materialOf(start)) >= MATERIAL };
}
