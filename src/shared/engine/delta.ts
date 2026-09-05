import type { Role } from "chessops/types";
import { ROLES } from "chessops/types";

import { CLASSICAL_VALUES } from "../chess";
import { featureId, type WeightVector } from "../eval";

const CAPTURE_VALUE = featureId("captureValue");

const MATERIAL_SLOTS = {
	pawn: featureId("materialPawn"),
	knight: featureId("materialKnight"),
	bishop: featureId("materialBishop"),
	rook: featureId("materialRook"),
	queen: featureId("materialQueen"),
	king: featureId("materialPawn"),
} as const satisfies Record<Role, number>;

// What the rest of the evaluation is allowed to be worth. Two pawns, in the centipawns every
// weight is written in.
//
// This is the wager delta pruning makes, and it is a wager: a capture moves mobility, king safety
// and every other term as well as the material, and nothing bounds those the way the piece values
// bound the material. Two pawns covers what a normal position swings by; a bot built out of large
// behavioural weights can swing by more, and will occasionally have a line pruned that it would
// have liked. That is the same bet every engine makes here, and it buys back most of what
// quiescence costs.
export const DELTA_MARGIN = 200;

// The most one capture can be worth to *this* bot, per role taken.
//
// Read off the bot's own weights rather than assumed: a Snake that prices a rook above a queen
// prunes by its own values, and a bot that weighs no material at all gets a bound of zero, which
// is the truth — captures cannot move a score that does not count them.
//
// Absolute values, because the bound has to be optimistic in both directions: a bot paid to shed
// material gains by being taken, and pruning it on a signed value would cut the lines it is
// playing for. `captureValue` counts alongside the material, since it is the other term a capture
// moves on its own — it prices the piece taken in classical pawns, which is what it is multiplied
// by here.
export function captureWorth(weights: WeightVector): Record<Role, number> {
	const worth = {} as Record<Role, number>;

	for (const role of ROLES) {
		worth[role] =
			Math.abs(weights[MATERIAL_SLOTS[role]]) +
			Math.abs(weights[CAPTURE_VALUE]) * CLASSICAL_VALUES[role];
	}

	// A king is never actually taken, so nothing is ever pruned on its account.
	worth.king = Infinity;

	return worth;
}
