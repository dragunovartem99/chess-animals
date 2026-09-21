import type { Animal } from "./types";

// Slides everything away from whatever could catch it (`offeredMaterial` −60; the Hare's is −20,
// the lab's d3 + q best −10).
export const PENGUIN: Animal = {
	emoji: "🐧",
	tint: "#4a5568",
	definition: {
		id: "penguin",
		search: { depth: 3, quiescence: true },
		base: "material",
		stockfish: { nodes: 500, mix: 16 },
		weights: { offeredMaterial: -60 },
	},
};
