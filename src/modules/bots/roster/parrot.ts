import type { Animal } from "./types";

// **Depth must stay even, quiescence off**: a symmetry reads the same from both seats, so negamax
// flips its sign each ply. The `material` base makes it copy only until copying hangs a piece.
export const PARROT: Animal = {
	emoji: "🦜",
	tint: "#2f9e44",
	definition: {
		id: "parrot",
		search: { depth: 2 },
		base: "material",
		weights: { mirrorRanks: 150 },
	},
};
