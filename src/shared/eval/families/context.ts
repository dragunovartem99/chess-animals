import { pawnAttacks } from "chessops/attacks";
import type { Chess } from "chessops/chess";
import { SquareSet } from "chessops/squareSet";
import type { ByColor, Color } from "chessops/types";
import { opposite } from "chessops/util";

// Everything more than one family needs, computed once per position rather than once per family.
// `us` is always the side to move: the whole evaluation is written from that perspective, so no
// feature is ever colour-specific and a bot plays the same way with either colour.
export type EvalContext = {
	position: Chess;
	us: Color;
	them: Color;
	// Squares each side's pawns attack — what makes a destination unsafe, and what a piece must
	// avoid to hold an outpost.
	pawnAttacks: ByColor<SquareSet>;
};

function attackedByPawns({ position, color }: { position: Chess; color: Color }): SquareSet {
	const pawns = position.board.pieces(color, "pawn");
	let attacked = SquareSet.empty();

	for (const square of pawns) attacked = attacked.union(pawnAttacks(color, square));

	return attacked;
}

export function createContext(position: Chess): EvalContext {
	const us = position.turn;

	return {
		position,
		us,
		them: opposite(us),
		pawnAttacks: {
			white: attackedByPawns({ position, color: "white" }),
			black: attackedByPawns({ position, color: "black" }),
		},
	};
}
