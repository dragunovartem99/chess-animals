import type { Chess } from "chessops/chess";
import type { Move } from "chessops/types";

// Overwrites `into` with `from`. `SquareSet`s are immutable and `path` is fixed once a game is
// set up, so almost every field is one reference; only the castling record's rook squares, which
// `play` clears in place, have to be copied square by square.
function copyInto({ from, into }: { from: Chess; into: Chess }): void {
	into.board.occupied = from.board.occupied;
	into.board.promoted = from.board.promoted;
	into.board.white = from.board.white;
	into.board.black = from.board.black;
	into.board.pawn = from.board.pawn;
	into.board.knight = from.board.knight;
	into.board.bishop = from.board.bishop;
	into.board.rook = from.board.rook;
	into.board.queen = from.board.queen;
	into.board.king = from.board.king;

	into.castles.castlingRights = from.castles.castlingRights;
	into.castles.rook.white.a = from.castles.rook.white.a;
	into.castles.rook.white.h = from.castles.rook.white.h;
	into.castles.rook.black.a = from.castles.rook.black.a;
	into.castles.rook.black.h = from.castles.rook.black.h;
	into.castles.path = from.castles.path;

	into.pockets = from.pockets;
	into.turn = from.turn;
	into.epSquare = from.epSquare;
	into.remainingChecks = from.remainingChecks;
	into.halfmoves = from.halfmoves;
	into.fullmoves = from.fullmoves;
}

// Plays `move` into the scratch position that belongs to `ply`, and hands it back.
export type Descend = (frame: { position: Chess; move: Move; ply: number }) => Chess;

// One position per ply, allocated the first time that ply is reached and overwritten on every
// visit after it. A search only ever holds one line at a time — a ply's position is dead the
// moment its subtree returns — so `afterMove`'s fresh `Chess`, with its board and its six little
// castling objects, was being allocated and collected tens of thousands of times a second for a
// board that a dozen field writes can carry instead. This is the search's hot allocation, and
// removing it is worth the scratch stack.
//
// A parent is never written while its children are searched, because they live at deeper plies —
// which is what lets the evaluator keep reading the position a move came from.
export function createDescend(): Descend {
	const byPly: Chess[] = [];

	return function descend({ position, move, ply }) {
		// The first visit to a ply borrows its parent for the shape of the position to allocate;
		// the copy below then overwrites every field of it.
		const into = (byPly[ply] ??= position.clone());

		copyInto({ from: position, into });
		into.play(move);

		return into;
	};
}
