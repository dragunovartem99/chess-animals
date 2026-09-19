import type { Animal } from "./types";

// The Raven's shape — depth 3, `quiescence` on — with a three-weight board-control stack: `space`
// holds ground in your half, and no other animal leads with it; `swarm` (20) walks the army at
// your king; `mobility` (10) keeps every piece active on the way in. Resolving the capture chain
// past the leaf is what stops the charge being suicide. The full-roster arena puts it top by a
// distance.
//
// Distinct from the Wolf, which is `swarm` alone at 600 and overcommits: the Tiger's charge is a
// thirtieth of the weight and braced by the other two, so it presses without throwing the army
// away.
//
// On this search every stack the lab tried — this one, the old `swarm` + `mobility` +
// `earlyQueen`, and `centralization` + `space` + `passedPawnPush` — rated within noise. This one
// won the Tiger its own lead feature and left `earlyQueen` to the Lion.
export const TIGER: Animal = {
	emoji: "🐅",
	tint: "#db7f2b",
	definition: {
		id: "tiger",
		search: { depth: 3, quiescence: true },
		base: "material",
		weights: { space: 6, swarm: 20, mobility: 10 },
	},
};
