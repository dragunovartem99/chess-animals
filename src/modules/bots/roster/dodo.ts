import type { Animal } from "./types";

// The paper's `suicide_king`: walk your own king at the other one and let the game come to you.
// `kingProximity` is the raw Chebyshev distance between the two kings — the one distance feature
// with no side subtracted from it, because it reads identically from either seat — so a negative
// weight closes the gap.
//
// **The depth must stay even.** That invariance is exactly the Parrot's problem: a feature that
// reads the same from both seats has its sign flipped once per ply by negamax, so at an odd depth
// the Dodo chases the *opposite* and runs its king into the corner. At depth 2 it evaluates with
// itself to move again and the sign is back where it belongs.
//
// The paper rates it a hair above random: unprincipled, but a king in the open is pressure that
// beats anything unwilling to punish it. No base, and no read on mate — it blunders into them and
// stumbles onto them in equal measure, which is the whole joke. No other animal reads
// `kingProximity`.
export const DODO: Animal = {
	emoji: "🦤",
	tint: "#7f8f9a",
	definition: {
		id: "dodo",
		search: { depth: 2 },
		temperature: 0,
		weights: { kingProximity: -10 },
	},
};
