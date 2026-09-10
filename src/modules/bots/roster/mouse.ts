import type { Animal } from "./types";

// Scurries along the walls and squeezes into the tightest corner it can find. A negative
// `centralization` pushes every piece to the rim — the Hippo read backwards — and a negative
// `mobility` pays it for every square it gives up, so its pieces huddle where they can barely
// move. Weak the way a small animal is, not the way the Dove and the Lemming are: it neither
// refuses a fight nor hands anything over, it just never comes out into the open.
//
// No base, so a capture is only ever taken by accident. At depth 1 it sat on the Lemming whatever
// the two numbers were — the rim and the cramp saturate, and it moved at random among the most
// cramped moves. Depth 3 is the lever: it looks ahead to keep the opponent roomy as well as itself
// cramped, and that lands it midway between the Dove and the Lemming. Both features are
// side-relative, so an odd depth reads them the right way round.
//
// No `givesMate`: it cannot see a mate either way.
export const MOUSE: Animal = {
	emoji: "🐁",
	tint: "#9e9aa6",
	definition: {
		id: "mouse",
		search: { depth: 3 },
		weights: { centralization: -20, mobility: -10 },
	},
};
