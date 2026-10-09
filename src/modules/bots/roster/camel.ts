import type { Animal } from "./types";

// King walk and passed pawns, both silent until the pieces come off; `development` covers the
// middlegame. Quiescence, since a pawn race is captures and promotions past the leaf.
export const CAMEL: Animal = {
	emoji: "🐪",
	tint: "#a38a63",
	definition: {
		id: "camel",
		search: { depth: 2, quiescence: true },
		base: "material",
		weights: { passedPawnPush: 24, kingActivity: 20, development: 20 },
	},
};
