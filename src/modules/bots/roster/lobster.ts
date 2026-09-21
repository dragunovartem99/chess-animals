import type { Animal } from "./types";

// Takes the squares your pieces want (`opponentMobility` −30; the Fox's is −8, the lab's d3 + q
// best −4), without the Fox's partner.
export const LOBSTER: Animal = {
	emoji: "🦞",
	tint: "#c0392b",
	definition: {
		id: "lobster",
		search: { depth: 3, quiescence: true },
		base: "material",
		stockfish: { nodes: 350, mix: 18 },
		weights: { opponentMobility: -30 },
	},
};
