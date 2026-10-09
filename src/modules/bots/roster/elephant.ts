import type { Animal } from "./types";

// Even depth, like the Parrot: the feature reads the same from both seats. At 600 a piece's colour
// outweighs a knight — an obsession, not a preference.
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
