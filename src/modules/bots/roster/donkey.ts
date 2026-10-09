import type { Animal } from "./types";

// The paper's `random_move`, the scale's reference point. No special case: with no weights every
// move scores zero and the tie-break picks uniformly.
export const DONKEY: Animal = {
	emoji: "🐴",
	tint: "#8c7c6d",
	definition: {
		id: "donkey",
		search: { depth: 1 },
		weights: {},
	},
};
