import type { Role } from "chessops/types";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";

// Kings are not counted: both sides always have exactly one, so the difference is always zero.
const MATERIAL_SLOTS: [Role, number][] = [
	["pawn", featureId("materialPawn")],
	["knight", featureId("materialKnight")],
	["bishop", featureId("materialBishop")],
	["rook", featureId("materialRook")],
	["queen", featureId("materialQueen")],
];

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

	for (const [role, slot] of MATERIAL_SLOTS) {
		features[slot] =
			board.pieces(context.us, role).size() - board.pieces(context.them, role).size();
	}
}
