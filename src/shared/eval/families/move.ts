import type { Chess } from "chessops/chess";
import { isNormal, type Move, type Role } from "chessops/types";

import { CLASSICAL_VALUES } from "../../chess";
import { featureId } from "../features";
import type { FeatureVector } from "../vector";

// The position a move was played from, alongside the move itself. The move-level family is the
// only one that needs to look backwards.
export type PlayedMove = { parent: Chess; move: Move };

const GIVES_CHECK = featureId("givesCheck");
const CAPTURE_VALUE = featureId("captureValue");

export const SLOTS = [GIVES_CHECK, CAPTURE_VALUE];

function capturedRole({ parent, move }: PlayedMove): Role | undefined {
	if (!isNormal(move)) return undefined;

	const target = parent.board.getRole(move.to);
	if (target) return target;

	// En passant leaves the captured pawn on a square the move never names.
	const movedPawn = parent.board.getRole(move.from) === "pawn";
	return movedPawn && move.to === parent.epSquare ? "pawn" : undefined;
}

// Everything the move itself did, written into the vector *negated*.
//
// The rest of the evaluation reads the position after the move, whose side to move is the
// opponent of whoever played it, and every feature is from that side's point of view. Negating
// here puts the move-level family in the same frame — and, because a negamax search maximises the
// negation of the child's score, it makes a positive weight mean "the mover wants this". So
// `captureValue: 100` is greedy, `givesCheck: -50` is `pacifist`, and neither needs its own
// player class.
export function extractMoveFeatures({
	position,
	played,
	features,
}: {
	position: Chess;
	played?: PlayedMove;
	features: FeatureVector;
}): void {
	if (!played) return;

	// Only `isCheck`, which is one attack test. Mate and stalemate are scored by `terminalTerm`
	// before extraction is ever reached, so asking about them here would be both redundant and,
	// in `isStalemate`'s case, a walk for a legal move on every quiet node of every search.
	if (position.isCheck()) features[GIVES_CHECK] = -1;

	const captured = capturedRole(played);
	if (captured) features[CAPTURE_VALUE] = -CLASSICAL_VALUES[captured];
}
