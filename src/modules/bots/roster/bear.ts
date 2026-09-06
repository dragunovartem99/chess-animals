import type { Animal } from "./types";

// Two positional weights that pull the same way: `centralization` drags every piece off the rim,
// `space` rewards holding ground in the enemy half. The Hippo has the first at depth 2; the Bear
// is the pair, a ply deeper — it claims the middle like the Hippo and then keeps pushing out into
// the other side. Third on the roster: below the Hare's prophylaxis pair, level with the Rhino,
// clear of the plain Owl.
export const BEAR: Animal = {
	emoji: "🐻",
	tint: "#6e5647",
	definition: {
		id: "bear",
		search: { depth: 3 },
		temperature: 0,
		base: "material",
		weights: { centralization: 8, space: 6 },
	},
};
