import type { Role } from "chessops/types";

// The classical piece values, in pawns. Three places need "what is this piece roughly worth" for
// a decision that is *not* an evaluation: move ordering sorts by it, `captureValue` prices what a
// move took, and `offeredMaterial` prices what is left en prise.
//
// Deliberately not the tunable material weights, and deliberately living below `eval` so it
// cannot become them: retuning a bot's piece values must not quietly re-sort the move list or
// move every capture-loving animal with it. One table rather than a copy per caller, because
// three identical literals with three copies of this paragraph is how they drift.
//
// A king is zero: it is never taken, never offered, and sorting by it would be meaningless.
export const CLASSICAL_VALUES: Record<Role, number> = {
	pawn: 1,
	knight: 3,
	bishop: 3,
	rook: 5,
	queen: 9,
	king: 0,
};
