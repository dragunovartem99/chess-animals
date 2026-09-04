import { attacks } from "chessops/attacks";
import type { Chess } from "chessops/chess";
import { SquareSet } from "chessops/squareSet";
import type { ByColor, Color, Piece } from "chessops/types";
import { opposite } from "chessops/util";

// One piece on the board, with the squares it attacks already worked out.
export type PieceReach = { square: number; piece: Piece; reach: SquareSet };

type AttackMaps = {
	reach: PieceReach[];
	pawnAttacks: ByColor<SquareSet>;
	attacksBy: ByColor<SquareSet>;
};

// Everything more than one family needs, computed once per position rather than once per family.
// `us` is always the side to move: the whole evaluation is written from that perspective, so no
// feature is ever color-specific and a bot plays the same way with either color.
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

function walkBoard(position: Chess): AttackMaps {
	const reach: PieceReach[] = [];
	const attacksBy = { white: SquareSet.empty(), black: SquareSet.empty() };
	const pawnAttacks = { white: SquareSet.empty(), black: SquareSet.empty() };

	for (const [square, piece] of position.board) {
		const squares = attacks(piece, square, position.board.occupied);

		reach.push({ square, piece, reach: squares });
		attacksBy[piece.color] = attacksBy[piece.color].union(squares);

		// `attacks` for a pawn is exactly its capture squares, so the pawn map falls out of the
		// same call rather than needing a second one.
		if (piece.role === "pawn")
			pawnAttacks[piece.color] = pawnAttacks[piece.color].union(squares);
	}

	return { reach, pawnAttacks, attacksBy };
}

// The walk is deferred because it is the expensive half and most bots never ask for it: it calls
// `attacks` on all thirty-two men, which measured 5 µs of a material-only bot's 5.3 µs a node.
// Families that only count pieces or read their squares — material, placement, proximity,
// symmetry — touch none of the three maps, so for the animals built out of those the board is
// never walked at all. The three share one walk because they all fall out of the same loop.
//
// A class rather than an object literal with getters, which is the one place in this codebase
// that shape is worth it: accessors declared in a literal are own properties built per instance
// and cost 1.5 µs a node to install — more than the walk they were meant to avoid — while on a
// prototype they are free (0.01 µs) and the walked path is unchanged.
class LazyContext implements EvalContext {
	readonly us: Color;
	readonly them: Color;
	#maps: AttackMaps | undefined;

	constructor(readonly position: Chess) {
		this.us = position.turn;
		this.them = opposite(position.turn);
	}

	get #walked(): AttackMaps {
		return (this.#maps ??= walkBoard(this.position));
	}

	get reach(): PieceReach[] {
		return this.#walked.reach;
	}

	get pawnAttacks(): ByColor<SquareSet> {
		return this.#walked.pawnAttacks;
	}

	get attacksBy(): ByColor<SquareSet> {
		return this.#walked.attacksBy;
	}
}

export function createContext(position: Chess): EvalContext {
	return new LazyContext(position);
}
