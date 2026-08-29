import { attacks } from "chessops/attacks";
import type { Chess } from "chessops/chess";
import { SquareSet } from "chessops/squareSet";
import type { ByColor, Color, Piece } from "chessops/types";
import { opposite } from "chessops/util";

// One piece on the board, with the squares it attacks already worked out.
export type PieceReach = { square: number; piece: Piece; reach: SquareSet };

// Everything more than one family needs, computed once per position rather than once per family.
// `us` is always the side to move: the whole evaluation is written from that perspective, so no
// feature is ever colour-specific and a bot plays the same way with either colour.
export type EvalContext = {
	position: Chess;
	us: Color;
	them: Color;
	// Every piece and what it attacks, from a single walk of the board. Five families used to
	// walk it themselves and call `attacks` again on every piece; this is the one call site.
	reach: PieceReach[];
	// Squares each side's pawns attack — what makes a destination unsafe, and what holds an
	// outpost.
	pawnAttacks: ByColor<SquareSet>;
	// Squares each side attacks with anything at all, pawns and king included. Defence is
	// membership in your own set, so this is what tells a hanging piece from a defended one.
	attacksBy: ByColor<SquareSet>;
};

export function createContext(position: Chess): EvalContext {
	const us = position.turn;
	const { board } = position;

	const reach: PieceReach[] = [];
	const attacksBy = { white: SquareSet.empty(), black: SquareSet.empty() };
	const byPawns = { white: SquareSet.empty(), black: SquareSet.empty() };

	for (const [square, piece] of board) {
		const squares = attacks(piece, square, board.occupied);

		reach.push({ square, piece, reach: squares });
		attacksBy[piece.color] = attacksBy[piece.color].union(squares);

		// `attacks` for a pawn is exactly its capture squares, so the pawn map falls out of the
		// same call rather than needing a second one.
		if (piece.role === "pawn") byPawns[piece.color] = byPawns[piece.color].union(squares);
	}

	return { position, us, them: opposite(us), reach, pawnAttacks: byPawns, attacksBy };
}
