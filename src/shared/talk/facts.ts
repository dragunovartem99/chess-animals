import type { Chess } from "chessops/chess";
import type { Color, NormalMove, Role } from "chessops/types";
import { opposite, squareRank } from "chessops/util";

import { afterMove, positionFromFen } from "../chess";
import { fromUci } from "../engine/uci/moves";

// What a move did: whether it gave check, and whether it won a piece.
export type Facts = { check: boolean; won: boolean };

// A game on `/play` as far as it has gone: the position before every ply, the opening position
// first, and the moves played from them.
export type Played = { fens: readonly string[]; moves: readonly string[] };

// Pawns an exchange must net for a side to be remarked on. Two, not a minor piece's three:
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

// What `move` takes from `position`, by the count above, or 0 for nothing. En passant takes a pawn
// from a square the move does not land on, and castling lands on a rook of the mover's own, which
// is not a capture.
function taken({ position, move }: { position: Chess; move: NormalMove }): number {
	const target = position.board.get(move.to);
	if (target?.color === opposite(position.turn)) return VALUES[target.role];

	const passant = move.to === position.epSquare && position.board.getRole(move.from) === "pawn";
	return passant ? VALUES.pawn : 0;
}

// The side to move's cheapest legal capture on `square`: the king last, since it can only take
// what nothing defends.
function cheapest({ position, square }: { position: Chess; square: number }) {
	let best: { move: NormalMove; cost: number } | undefined;
	for (const [from, dests] of position.allDests()) {
		const role = position.board.getRole(from);
		if (!role || !dests.has(square)) continue;

		const cost = role === "king" ? Infinity : VALUES[role];
		const last = role === "pawn" && [0, 7].includes(squareRank(square));
		const move = { from, to: square, promotion: last ? ("queen" as const) : undefined };
		if (!best || cost < best.cost) best = { move, cost };
	}

	return best?.move;
}

// What the side to move stands to gain by taking back on `square`, trading down its cheapest
// piece first and stopping whenever going on would lose: a static exchange. Read off the legal
// moves, so a pinned piece does not take and a king does not walk into a defended square.
function recapture({ position, square }: { position: Chess; square: number }): number {
	const move = cheapest({ position, square });
	if (!move) return 0;

	const gain = taken({ position, move });
	return Math.max(0, gain - recapture({ position: afterMove({ position, move }), square }));
}

type Ply = { position: Chess; move: NormalMove; value: number };

// The move that made `ply`, and what it took.
function plyOf({ fens, moves, ply }: Played & { ply: number }): Ply | undefined {
	const fen = fens[ply - 1];
	const uci = moves[ply - 1];
	if (fen === undefined || uci === undefined) return undefined;

	const position = positionFromFen(fen);
	const move = fromUci({ position, uci });
	if (!move) return undefined;

	return { position, move, value: taken({ position, move }) };
}

// The run of captures on one square that ends with `ply`, latest first.
function runOf({ fens, moves, ply }: Played & { ply: number }): Ply[] {
	const run: Ply[] = [];
	for (let at = ply; at > 0; at -= 1) {
		const one = plyOf({ fens, moves, ply: at });
		if (!one?.value || (run[0] && one.move.to !== run[0].move.to)) break;
		run.push(one);
	}

	return run;
}

// What the exchange stands to net whoever made the capture `run[0]`: what the run took on the
// square, their captures less the other side's, less the best the other side can still take back.
function outlook(run: readonly Ply[]): number {
	const [last] = run;
	if (!last) return 0;

	const net = run.reduce(
		(sum, one, index) => sum + (index % 2 === 0 ? one.value : -one.value),
		0
	);
	return net - recapture({ position: afterMove(last), square: last.move.to });
}

// The facts of `ply`.
//
// A capture wins a piece when the exchange it is part of stands to net `MATERIAL` for its side
// even after the best recapture: a queen taken by a knight is said on the spot, not once the pawn
// takes the knight back. Counted on the one square, from the captures the game played there and a
// static exchange over what is left, so an even trade stays quiet and a capture elsewhere is never
// folded into it. Read from
// the moves played, never from a line an engine expects, and never before the piece is taken,
// which would give a hanging piece away.
export function moveFacts({ fens, moves, ply }: Played & { ply: number }): Facts {
	const now = plyOf({ fens, moves, ply });
	if (!now) return { check: false, won: false };

	const check = afterMove(now).isCheck();
	const won = now.value > 0 && outlook(runOf({ fens, moves, ply })) >= MATERIAL;

	return { check, won };
}
