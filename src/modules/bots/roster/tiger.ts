import type { Animal } from "./types";

// The Raven's shape — depth 3, `quiescence` on — with an aggressive-mobile two-weight stack:
// `swarm` (40) drives the whole army at the enemy king, `mobility` (10) keeps every piece
// active on the way in. LAB.md's earlier verdict was "swarm only works solo — two charge-the-king
// signals hang the army", but that was at depth 3 *without* quiescence: resolving the capture
// chain past the leaf is what stops the charge being suicide. The full-roster arena puts it top
// by a distance, beating the Raven's bare build ~7-in-8.
//
// Distinct from the Wolf, which is `swarm` alone at 400 and overcommits: the Tiger's charge is
// a tenth of the weight and braced by `mobility`, so it presses without throwing the army away.
export const TIGER: Animal = {
	emoji: "🐅",
	tint: "#db7f2b",
	definition: {
		id: "tiger",
		search: { depth: 3, quiescence: true },
		base: "material",
		weights: { swarm: 40, mobility: 10 },
	},
};
