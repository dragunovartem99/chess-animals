import type { Animal } from "./types";

// Two positional weights that pull the same way: `centralization` drags every piece off the rim,
// `space` rewards holding ground in the enemy half. It claims the middle and then keeps pushing
// out into the other side.
//
// `castled` is the small third weight: tuck the king away, then take the board. It is sparse — it
// only moves a decision in the opening — but the lab put it ~+100 over the bare pair, as much as
// borrowing the Hare's `hanging` did, without the borrowing. Heavier (80) gave the gain back.
export const BEAR: Animal = {
	emoji: "🐻",
	tint: "#6e5647",
	definition: {
		id: "bear",
		search: { depth: 3 },
		base: "material",
		weights: { centralization: 8, space: 6, castled: 40 },
	},
};
