import { COLORS, type Color, type Role, ROLES } from "chessops/types";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";
import { chebyshev } from "./masks";

const SWARM = featureId("swarm");
const HUDDLE = featureId("huddle");
const KING_PROXIMITY = featureId("kingProximity");
const REVERSE_STARTING = featureId("reverseStarting");

export const SLOTS = [SWARM, HUDDLE, KING_PROXIMITY, REVERSE_STARTING];

const BACK_RANK_FILES: Partial<Record<Role, number[]>> = {
	rook: [0, 7],
	knight: [1, 6],
	bishop: [2, 5],
	queen: [3],
	king: [4],
};

// Where a side's pieces stand in the *opponent's* opening position — the squares
// `reverseStarting` walks towards. Built once at module load rather than per piece per node.
const HOME_SQUARES = Object.fromEntries(
	COLORS.map((color) => [
		color,
		Object.fromEntries(
			ROLES.map((role) => {
				const backRank = color === "white" ? 7 : 6;
				if (role === "pawn")
					return [role, Array.from({ length: 8 }, (_, file) => backRank * 8 + file)];

				const rank = color === "white" ? 7 : 0;
				return [role, (BACK_RANK_FILES[role] ?? []).map((file) => rank * 8 + file)];
			})
		) as Record<Role, number[]>,
	])
) as Record<Color, Record<Role, number[]>>;

// The *mean* distance, not the total. Summing made the term a measure of material with the sign
// inverted: every extra piece adds its own distance to your own side of the subtraction, so a
// side that is ahead reads as the worse swarmer. In a Scholar's mate — White's queen sitting on
// f7 beside the black king — the totals gave Black the better swarm score, purely because Black
// had one fewer piece left to count. Dividing by the piece count cancels that out and leaves the
// thing the feature is named for.
function meanDistance({
	context,
	color,
	target,
}: {
	context: EvalContext;
	color: Color;
	target: number;
}): number {
	const targetFile = target & 7;
	const targetRank = target >> 3;
	let total = 0;
	let count = 0;

	// Chebyshev distance, inlined: this runs for every piece of both sides, four times per
	// position, and the call's argument object was costing more than the arithmetic.
	for (const square of context.position.board[color]) {
		const file = Math.abs((square & 7) - targetFile);
		const rank = Math.abs((square >> 3) - targetRank);

		total += file > rank ? file : rank;
		count += 1;
	}

	return count === 0 ? 0 : total / count;
}

// How far a side's pieces are, on average, from where they would stand if the board were upside
// down. A mean for the same reason as `meanDistance`.
function reverseDistance({ context, color }: { context: EvalContext; color: Color }): number {
	const homes = HOME_SQUARES[color];
	let total = 0;
	let count = 0;

	for (const { square, piece } of context.reach) {
		if (piece.color !== color) continue;

		const targets = homes[piece.role];
		const file = square & 7;
		const rank = square >> 3;
		let nearest = Infinity;

		for (const target of targets) {
			const fileGap = Math.abs(file - (target & 7));
			const rankGap = Math.abs(rank - (target >> 3));
			const distance = fileGap > rankGap ? fileGap : rankGap;

			if (distance < nearest) nearest = distance;
		}

		if (nearest === Infinity) continue;

		total += nearest;
		count += 1;
	}

	return count === 0 ? 0 : total / count;
}

// The distance strategies, all measured in king moves. `swarm` charges the enemy king with
// everything, `huddle` builds a wall around its own, and `reverseStarting` walks the whole army
// into the opponent's opening position. Each is one weight away from being a bot.
export function extractProximity({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	const { board } = context.position;
	const ourKing = board.kingOf(context.us);
	const theirKing = board.kingOf(context.them);
	if (ourKing === undefined || theirKing === undefined) return;

	features[SWARM] =
		meanDistance({ context, color: context.us, target: theirKing }) -
		meanDistance({ context, color: context.them, target: ourKing });

	features[HUDDLE] =
		meanDistance({ context, color: context.us, target: ourKing }) -
		meanDistance({ context, color: context.them, target: theirKing });

	// The two kings are the same distance apart from either side's point of view, so this one is
	// a raw value rather than a difference — there is nothing to subtract.
	features[KING_PROXIMITY] = chebyshev({ from: ourKing, to: theirKing });

	features[REVERSE_STARTING] =
		reverseDistance({ context, color: context.us }) -
		reverseDistance({ context, color: context.them });
}
