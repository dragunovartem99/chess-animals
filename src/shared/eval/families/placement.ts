import type { Role } from "chessops/types";
import { ROLES } from "chessops/types";
import { squareFile, squareRank } from "chessops/util";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";

function capitalise(role: Role): string {
	return role[0].toUpperCase() + role.slice(1);
}

const ROLE_SLOTS = ROLES.map((role) => ({
	role,
	centralization: featureId(`centralization${capitalise(role)}`),
	advancement: featureId(`advancement${capitalise(role)}`),
}));

export const SLOTS = ROLE_SLOTS.flatMap((slot) => [slot.centralization, slot.advancement]);

// 0 in a corner, 6 on one of the four central squares. Cheaper than a table and, unlike one,
// tunable with a single number per role.
function centrality(square: number): number {
	const file = squareFile(square);
	const rank = squareRank(square);

	return Math.min(file, 7 - file) + Math.min(rank, 7 - rank);
}

// Two numbers per role — how central its pieces stand, and how far up the board — in place of a
// piece-square table's sixty-four. A knight that wants the centre and a rook that wants the
// seventh come out of the same two sliders.
export function extractPlacement({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	const { board } = context.position;

	for (const slot of ROLE_SLOTS) {
		let central = 0;
		let advanced = 0;

		for (const color of [context.us, context.them]) {
			const sign = color === context.us ? 1 : -1;
			const white = color === "white";

			for (const square of board.pieces(color, slot.role)) {
				central += sign * centrality(square);
				// `advancement` inlined for the same reason as in `proximity`: it runs once per
				// piece per role, and the argument object outweighed the subtraction.
				advanced += sign * (white ? square >> 3 : 7 - (square >> 3));
			}
		}

		features[slot.centralization] = central;
		features[slot.advancement] = advanced;
	}
}
