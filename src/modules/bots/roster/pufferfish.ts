import type { Animal } from "./types";

// The Sloth's idea, turned up (`huddle` 300; the lab's d3 + q best is 20, and the Sloth's is 550):
// every piece crowds round its own king. Nearly a third of its moves are its own, and Stockfish
// sees almost nothing (60 nodes) on the rest.
export const PUFFERFISH: Animal = {
	emoji: "🐡",
	tint: "#c9a227",
	definition: {
		id: "pufferfish",
		search: { depth: 3, quiescence: true },
		base: "material",
		stockfish: { nodes: 60, mix: 30 },
		weights: { huddle: 300 },
	},
};
