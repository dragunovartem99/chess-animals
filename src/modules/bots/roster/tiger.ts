import type { Animal } from "./types";

// The Raven's shape — depth 3, `quiescence` on — with a two-weight board-control pair: `swarm`
// (20) walks the army at your king, and `mobility` (10) keeps every piece active on the way in.
// Resolving the capture chain past the leaf is what stops the charge being suicide.
//
// Distinct from the Wolf, which is `swarm` alone at 600 and overcommits: the Tiger's charge is a
// thirtieth of the weight and braced by `mobility`, so it presses without throwing the army away.
//
// `space` dropped: it repeats what `swarm` and `mobility` already read (observation 5), and
// pulling it out rated the Tiger *higher*, not lower, in three separate runs — it was buying
// nothing.
export const TIGER: Animal = {
	emoji: "🐅",
	tint: "#db7f2b",
	definition: {
		id: "tiger",
		search: { depth: 3, quiescence: true },
		base: "material",
		weights: { swarm: 20, mobility: 10 },
	},
};
