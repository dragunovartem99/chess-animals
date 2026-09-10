import type { Animal } from "./types";

// The childhood strategy — every piece on a square of its own colour, White on light, Black on
// dark. Even depth, same reason as the Parrot: the feature reads the same from either seat, so
// negamax flips its sign every ply.
//
// At 600 the colour is worth more than a knight, so it gives up material to keep its pieces on
// their squares — an obsession rather than a preference. At 100 it sat on top of the Wolf; 600
// drops it below the Sloth, halfway to the Parrot, and heavier weights stop moving it.
export const ELEPHANT: Animal = {
	emoji: "🐘",
	tint: "#7c7f86",
	definition: {
		id: "elephant",
		search: { depth: 2 },
		base: "material",
		weights: { sameColorSquares: 600 },
	},
};
