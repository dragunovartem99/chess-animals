import { type Color, ROLES } from "chessops/types";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";
import { HOME_SQUARES } from "./homeSquares";
import { chebyshev } from "./masks";

const SWARM = featureId("swarm");
const HUDDLE = featureId("huddle");
const KING_PROXIMITY = featureId("kingProximity");
const REVERSE_STARTING = featureId("reverseStarting");

export const SLOTS = [SWARM, HUDDLE, KING_PROXIMITY, REVERSE_STARTING];

// The *mean* distance, not the total. Summing made the term a measure of material with the sign
// inverted: every extra piece adds its own distance to your own side of the subtraction, so a
// side that is ahead reads as the worse swarmer. In a Scholar's mate — White's queen sitting on
// f7 beside the black king — the totals gave Black the better swarm score, purely because Black
// had one fewer piece left to count. Dividing by the piece count cancels that out and leaves the
// thing the feature is named for.
// Both kings in one walk: `swarm` and `huddle` are the same measurement against different
// targets, and an army is walked once per side rather than once per feature per side.
function meanDistances({
	context,
	color,
	kings,
}: {
	context: EvalContext;
	color: Color;
	kings: { ours: number; theirs: number };
}): { ours: number; theirs: number } {
	const ourFile = kings.ours & 7;
	const ourRank = kings.ours >> 3;
	const theirFile = kings.theirs & 7;
	const theirRank = kings.theirs >> 3;

	let toOurs = 0;
	let toTheirs = 0;
	let count = 0;

	// Chebyshev distance, inlined: this runs for every piece of both sides, and the call's
	// argument object was costing more than the arithmetic. The army is walked as the bit loop
	// behind a `SquareSet`'s iterator for the same reason — for a bot built on this family it is
	// the whole evaluation, twice a node.
	const army = context.position.board[color];

	for (let half = 0; half < 2; half += 1) {
		let bits = half === 0 ? army.lo : army.hi;

		while (bits !== 0) {
			const square = (half << 5) + 31 - Math.clz32(bits & -bits);
			bits &= bits - 1;

			const file = square & 7;
			const rank = square >> 3;

			const ourFileGap = Math.abs(file - ourFile);
			const ourRankGap = Math.abs(rank - ourRank);
			toOurs += ourFileGap > ourRankGap ? ourFileGap : ourRankGap;

			const theirFileGap = Math.abs(file - theirFile);
			const theirRankGap = Math.abs(rank - theirRank);
			toTheirs += theirFileGap > theirRankGap ? theirFileGap : theirRankGap;

			count += 1;
		}
	}

	if (count === 0) return { ours: 0, theirs: 0 };

	return { ours: toOurs / count, theirs: toTheirs / count };
}

// How far a side's pieces are, on average, from where they would stand if the board were upside
// down. A mean for the same reason as `meanDistance`.
function reverseDistance({ context, color }: { context: EvalContext; color: Color }): number {
	const homes = HOME_SQUARES[color];
	const { board } = context.position;
	let total = 0;
	let count = 0;

	// Walked a role at a time off the board's own bitboards, rather than through `context.reach`:
	// this family wants a piece's square and role and never what it attacks, and asking for
	// `reach` would make a bot here pay for the attack walk it has no feature to spend it on.
	for (const role of ROLES) {
		const targets = homes[role];
		if (targets.length === 0) continue;

		for (const square of board.pieces(color, role)) {
			const file = square & 7;
			const rank = square >> 3;
			let nearest = Infinity;

			for (const target of targets) {
				const fileGap = Math.abs(file - (target & 7));
				const rankGap = Math.abs(rank - (target >> 3));
				const distance = fileGap > rankGap ? fileGap : rankGap;

				if (distance < nearest) nearest = distance;
			}

			total += nearest;
			count += 1;
		}
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

	if (context.weighs(SWARM) || context.weighs(HUDDLE)) {
		const kings = { ours: ourKing, theirs: theirKing };
		const ours = meanDistances({ context, color: context.us, kings });
		// From their side of the board the two kings swap roles, so their means come back
		// reversed.
		const theirs = meanDistances({ context, color: context.them, kings });

		features[SWARM] = ours.theirs - theirs.ours;
		features[HUDDLE] = ours.ours - theirs.theirs;
	}

	// The two kings are the same distance apart from either side's point of view, so this one is
	// a raw value rather than a difference — there is nothing to subtract.
	features[KING_PROXIMITY] = chebyshev({ from: ourKing, to: theirKing });

	// Behind its own gate because it is the priciest feature in the registry — both armies,
	// against every home square of their role — and a bot naming one feature of this family was
	// spending more of its search here than in the search.
	if (context.weighs(REVERSE_STARTING)) {
		features[REVERSE_STARTING] =
			reverseDistance({ context, color: context.us }) -
			reverseDistance({ context, color: context.them });
	}
}
