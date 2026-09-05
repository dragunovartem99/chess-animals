import { attacks } from "chessops/attacks";
import type { Chess } from "chessops/chess";
import { SquareSet } from "chessops/squareSet";
import { type ByColor, type Color, COLORS, type Piece, ROLES } from "chessops/types";
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
	// Whether a slot's weight is non-zero for the bot being scored — the same question
	// `createExtractor` asks of a whole family, asked of one feature.
	//
	// Family granularity is not always enough. `reverseStarting` walks both armies against every
	// role's home squares, while the features beside it in the same family cost a few bitboard
	// operations. An animal that names one of the proximity features was paying for all of them,
	// and the expensive one dominated its search. A cheap feature is not worth a branch; one that
	// walks the board is.
	weighs: (slot: number) => boolean;
};

function walkBoard(position: Chess): AttackMaps {
	const reach: PieceReach[] = [];
	const attacksBy = { white: SquareSet.empty(), black: SquareSet.empty() };
	const pawnAttacks = { white: SquareSet.empty(), black: SquareSet.empty() };

	// Walked a colour and a role at a time off the bitboards that already separate them. The
	// board's own iterator works the other way round — it resolves every square's colour and role
	// by scanning eight sets, and hands back a fresh pair and a fresh `Piece` for each — which is
	// sixty-odd objects a node for facts that are one intersection away. The `Piece` here is
	// shared by every man of its kind, which nothing downstream may mutate and nothing does.
	for (const color of COLORS) {
		const ours = position.board[color];

		for (const role of ROLES) {
			const piece: Piece = { color, role };

			for (const square of position.board[role].intersect(ours)) {
				const squares = attacks(piece, square, position.board.occupied);

				reach.push({ square, piece, reach: squares });
				attacksBy[color] = attacksBy[color].union(squares);

				// `attacks` for a pawn is exactly its capture squares, so the pawn map falls out
				// of the same call rather than needing a second one.
				if (role === "pawn") pawnAttacks[color] = pawnAttacks[color].union(squares);
			}
		}
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
	readonly position: Chess;
	readonly us: Color;
	readonly them: Color;
	readonly weighs: (slot: number) => boolean;
	#maps: AttackMaps | undefined;

	constructor({ position, weighs }: { position: Chess; weighs: (slot: number) => boolean }) {
		this.position = position;
		this.us = position.turn;
		this.them = opposite(position.turn);
		this.weighs = weighs;
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

// Every feature counts unless the caller says otherwise — the breakdown the UI shows reads them
// all, and only a search knows which ones its bot leaves at zero.
const WEIGHS_EVERYTHING = () => true;

export function createContext({
	position,
	weighs = WEIGHS_EVERYTHING,
}: {
	position: Chess;
	weighs?: (slot: number) => boolean;
}): EvalContext {
	return new LazyContext({ position, weighs });
}
