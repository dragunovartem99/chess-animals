import type { Animal } from "./types";

// Scurries along the walls and squeezes into the tightest corner it can find. A negative
// `centralization` pushes every piece to the rim — the Hippo read backwards — and a negative
// `mobility` pays it for every square it gives up, so its pieces huddle where they can barely
// move. Weak the way a small animal is, not the way the Dove and the Lemming are: it neither
// refuses a fight nor hands anything over, it just never comes out into the open.
//
// No base and depth 1, so among the moves that keep it cramped it moves at random, and a capture
// is only ever taken by accident. It rates level with the Lemming whatever the two numbers are —
// the rim and the cramp saturate. Depth 3 dropped it midway to the Dove, but at a search cost
// that made it the slowest animal to test for no idea it did not already have.
//
// No `givesMate`: it cannot see a mate either way.
export const MOUSE: Animal = {
	emoji: "🐁",
	tint: "#9e9aa6",
	definition: {
		id: "mouse",
		search: { depth: 1 },
		weights: { centralization: -20, mobility: -10 },
	},
};
