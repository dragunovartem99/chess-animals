import type { Animal } from "./types";

// Two positional weights that pull the same way: `centralization` drags every piece off the rim,
// `space` rewards holding ground in the enemy half. The Hippo has the first at depth 2; the Bear
// is the pair, a ply deeper — it claims the middle like the Hippo and then keeps pushing out into
// the other side. At 12 and 9 — half as much again as the lab's 8 and 6 — it measured a shade
// stronger, and sits in the Owl-to-Hare band beside the Snake.
export const BEAR: Animal = {
	emoji: "🐻",
	tint: "#6e5647",
	definition: {
		id: "bear",
		search: { depth: 3 },
		base: "material",
		weights: { centralization: 12, space: 9 },
	},
};
