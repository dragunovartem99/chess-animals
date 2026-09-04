import type { Role } from "chessops/types";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";

// Kings are not counted: both sides always have exactly one, so the difference is always zero.
const ROLE_SLOTS: [Role, number][] = [
	["pawn", featureId("materialPawn")],
	["knight", featureId("materialKnight")],
	["bishop", featureId("materialBishop")],
	["rook", featureId("materialRook")],
	["queen", featureId("materialQueen")],
];

export const SLOTS = ROLE_SLOTS.map(([, slot]) => slot);

// The count difference per role, so the weight *is* the piece value. A bot that values a knight
// above a rook is one number away, which is the point.
export function extractMaterial({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	const { board } = context.position;

	for (const [role, slot] of ROLE_SLOTS) {
		features[slot] =
			board.pieces(context.us, role).size() - board.pieces(context.them, role).size();
	}
}
