import type { Animal } from "./types";

// Brings out every piece to play, one after another (`development` 120; the Camel's is 20).
export const OTTER: Animal = {
	emoji: "🦦",
	tint: "#8d6e4f",
	definition: {
		id: "otter",
		search: { depth: 3, quiescence: true },
		base: "material",
		stockfish: { nodes: 900, mix: 12 },
		weights: { development: 120 },
	},
};
