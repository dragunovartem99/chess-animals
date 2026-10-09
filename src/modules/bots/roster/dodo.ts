import type { Animal } from "./types";

// The paper's `suicide_king`. **Depth must stay even**: `kingProximity` reads the same from both
// seats, so negamax flips its sign each ply and an odd depth runs the king to the corner.
export const DODO: Animal = {
	emoji: "🦤",
	tint: "#7f8f9a",
	definition: {
		id: "dodo",
		search: { depth: 2 },
		weights: { kingProximity: 10 },
	},
};
