import type { Animal } from "./types";

// The Spider's idea in a d3 + q body (`mobility` 30; the Spider's is 10): every piece as far out as
// it reaches.
export const OCTOPUS: Animal = {
	emoji: "🐙",
	tint: "#a4508b",
	definition: {
		id: "octopus",
		search: { depth: 3, quiescence: true },
		base: "material",
		stockfish: { nodes: 1200, mix: 10 },
		weights: { mobility: 30 },
	},
};
