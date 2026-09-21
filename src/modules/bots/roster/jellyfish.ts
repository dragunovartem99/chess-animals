import type { Animal } from "./types";

// Everything drifts forward together (`pushDepth` 40; the lab's d3 + q best is 10). Beaten by what
// it leaves behind.
export const JELLYFISH: Animal = {
	emoji: "🪼",
	tint: "#7fb8d9",
	definition: {
		id: "jellyfish",
		search: { depth: 3, quiescence: true },
		base: "material",
		stockfish: { nodes: 150, mix: 24 },
		weights: { pushDepth: 40 },
	},
};
