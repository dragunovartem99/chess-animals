import type { Animal } from "./types";

// Back to the middle of the board (`centralization` 40; the lab's d3 + q best is 4).
export const DOLPHIN: Animal = {
	emoji: "🐬",
	tint: "#3f8fbf",
	definition: {
		id: "dolphin",
		search: { depth: 3, quiescence: true },
		base: "material",
		stockfish: { nodes: 250, mix: 20 },
		weights: { centralization: 40 },
	},
};
