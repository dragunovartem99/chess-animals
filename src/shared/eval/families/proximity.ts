import type { Color } from "chessops/types";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";
import { chebyshev } from "./masks";

const SWARM = featureId("swarm");
const HUDDLE = featureId("huddle");
const KING_PROXIMITY = featureId("kingProximity");

export const SLOTS = [SWARM, HUDDLE, KING_PROXIMITY];

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

// The distance strategies, all measured in king moves and all negated on the way out, so more is
// nearer and a positive weight always means "the mover wants this" — the same convention the move
// family holds to. `swarm` charges the enemy king with everything, `huddle` builds a wall around
// its own. Each is one weight away from being a bot.
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

		// Negated, so the number rises as the army closes in and a *positive* weight is the
		// charge the feature is named for. Measured as a distance these read backwards: every
		// animal on them — the Wolf, the Sloth, the Tiger — had to write a negative weight to
		// mean the thing the key says, and the comments above had to keep saying so.
		features[SWARM] = theirs.ours - ours.theirs;
		features[HUDDLE] = theirs.theirs - ours.ours;
	}

	// The two kings are the same distance apart from either side's point of view, so this one is
	// a raw value rather than a difference — there is nothing to subtract. Negated like the two
	// above: `kingProximity` is closeness, which is what the key has always said and what a
	// positive weight now buys.
	features[KING_PROXIMITY] = -chebyshev({ from: ourKing, to: theirKing });
}
