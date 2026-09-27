import type { Chess } from "chessops/chess";
import { ROLES } from "chessops/types";
import type { Color, NormalMove, Role } from "chessops/types";

import { afterMove, positionFromFen } from "../chess";
import { fromUci } from "../engine/uci/moves";

// What a move did: whether it gave check, and the piece it won, if it won one.
export type Facts = { check: boolean; won?: Role };

// A game on `/play` as far as it has gone: the position before every ply, the opening position
// first, and the moves played from them.
export type Played = { fens: readonly string[]; moves: readonly string[] };

// Pawns an exchange must net for the capturer to be remarked on. A clean minor piece clears it; a
// pawn, or a pawn and some position, does not.
export const MATERIAL = 3;

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

type Ply = { position: Chess; move: NormalMove; captured?: Role };

// The move that made `ply`, and the piece it took. En passant takes a pawn from a square the move
// does not land on, and castling lands on a rook of the mover's own, which is not a capture.
function plyOf({ fens, moves, ply }: Played & { ply: number }): Ply | undefined {
	const fen = fens[ply - 1];
	const uci = moves[ply - 1];
	if (fen === undefined || uci === undefined) return undefined;

	const position = positionFromFen(fen);
	const move = fromUci({ position, uci });
	if (!move) return undefined;

	const target = position.board.get(move.to);
	const passant = move.to === position.epSquare && position.board.getRole(move.from) === "pawn";
	const captured =
		target && target.color !== position.turn ? target.role : passant ? "pawn" : undefined;
	return captured ? { position, move, captured } : { position, move };
}

// The piece the capture on `ply` won for its side, if any: the most valuable it took in the run of
// captures that capture ends.
//
// Judged on the board, from before the run began to after the observer's `reply`, rather than by a
// swing in the observer's score: the observer sees a fork or a pin a move or two ahead, so by the
// capture the gain is long priced in and swings nothing. The reply is what tells a piece won from
// the first half of a trade. Read from the positions alone, so a verdict that never came for an
// earlier ply cannot silence this one.
function pieceWon({ run, after, reply }: { run: [Ply, ...Ply[]]; after: Chess; reply?: string }) {
	const answer = reply === undefined ? undefined : fromUci({ position: after, uci: reply });
	const settled = materialOf(answer ? afterMove({ position: after, move: answer }) : after);
	const [now] = run;
	const start = run.at(-1) ?? now;

	const sign = now.position.turn === "white" ? 1 : -1;
	if (sign * (settled - materialOf(start.position)) < MATERIAL) return undefined;

	const taken = run.filter((_, index) => index % 2 === 0).flatMap((one) => one.captured ?? []);
	return taken.reduce((best, role) => (VALUES[role] > VALUES[best] ? role : best));
}

// The facts of `ply`, answered by the observer's `reply`.
export function moveFacts({
	fens,
	moves,
	ply,
	reply,
}: Played & { ply: number; reply?: string }): Facts {
	const now = plyOf({ fens, moves, ply });
	if (!now) return { check: false };

	const after = afterMove(now);
	const check = after.isCheck();
	if (!now.captured) return { check };

	// The run of captures back from `ply`, latest first.
	const run: [Ply, ...Ply[]] = [now];
	for (let at = ply - 1; at > 0; at -= 1) {
		const one = plyOf({ fens, moves, ply: at });
		if (!one?.captured) break;
		run.push(one);
	}
	const won = pieceWon({ run, after, reply });
	return won ? { check, won } : { check };
}
