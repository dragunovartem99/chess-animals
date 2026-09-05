import type { Animal } from "./types";

// The childhood strategy — every piece on a square of its own colour, White on light, Black on
// dark. Even depth, same reason as the Parrot: the feature reads the same from either seat, so
// negamax flips its sign every ply.
export const ELEPHANT: Animal = {
	emoji: "🐘",
	tint: "#82786b",
	definition: {
		id: "elephant",
		search: { depth: 2 },
		temperature: 0,
		base: "material",
		weights: { sameColorSquares: 100 },
	},
};
