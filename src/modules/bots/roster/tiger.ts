import type { Animal } from "./types";

// The Raven's shape — depth 3, `quiescence` on — with an aggressive-mobile three-weight stack:
// `swarm` (-40) drives the whole army at the enemy king, `mobility` (10) keeps every piece
// active on the way in, `space` (6) holds the ground the charge takes. LAB.md's earlier verdict
// was "swarm only works solo — two charge-the-king signals hang the army", but that was at depth
// 3 *without* quiescence: resolving the capture chain past the leaf is what stops the charge
// being suicide. In the lab-only run it beat the Raven's bare build 86-14, second of eight — the
// only combo above it, `mobility`+`space`+`centralization`, carries no personality at all.
//
// Distinct from the Wolf, which is `swarm` alone at -400 and overcommits: the Tiger's charge is
// half the weight and braced by two positional signals, so it presses without throwing the army
// away.
export const TIGER: Animal = {
	emoji: "🐅",
	tint: "#db7f2b",
	definition: {
		id: "tiger",
		search: { depth: 3, quiescence: true },
		temperature: 0,
		base: "material",
		weights: { swarm: -40, mobility: 10, space: 6 },
	},
};
