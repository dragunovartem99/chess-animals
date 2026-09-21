import type { Animal } from "./types";

// Takes room (`space` 30; the lab's d3 + q best is 3): the least diluted habit, so the least to find.
export const WHALE: Animal = {
	emoji: "🐋",
	tint: "#4a6fa5",
	definition: {
		id: "whale",
		search: { depth: 3, quiescence: true },
		base: "material",
		stockfish: { nodes: 2200, mix: 6 },
		weights: { space: 30 },
	},
};
