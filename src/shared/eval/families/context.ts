import type { Chess } from "chessops/chess";
import { SquareSet } from "chessops/squareSet";
import type { ByColor, Color, Piece } from "chessops/types";
import { opposite } from "chessops/util";

import { type AttackMaps, walkBoard } from "./walk";

// One piece on the board, with the squares it attacks already worked out.
export type PieceReach = { square: number; piece: Piece; reach: SquareSet };

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
	// How much non-pawn material is left, 1 at the start down to 0 with bare kings and pawns. It is
	// a scalar a feature may shape its own value by, never a second weight vector — see METHOD.md.
	phase: number;
	// Whether a slot's weight is non-zero for the bot being scored — the same question
	// `createExtractor` asks of a whole family, asked of one feature.
	//
	// Family granularity is not always enough. `swarm` and `huddle` walk both armies against the
	// kings, while `kingProximity` beside them in the same family is one Chebyshev call. An animal
	// that names only `kingProximity` was paying for the army walk too. A cheap feature is not
	// worth a branch; one that walks the board is.
	weighs: (slot: number) => boolean;
};

// Minor pieces count 1, a rook 2, a queen 4 — the usual phase units, 24 in the opening position.
// Capped so an extra promoted queen does not read as "earlier than the start".
const FULL_PHASE = 24;

function phaseOf(position: Chess): number {
	const { knight, bishop, rook, queen } = position.board;
	const units = knight.size() + bishop.size() + rook.size() * 2 + queen.size() * 4;

	return Math.min(units, FULL_PHASE) / FULL_PHASE;
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
	#phase: number | undefined;

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

	get phase(): number {
		return (this.#phase ??= phaseOf(this.position));
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
