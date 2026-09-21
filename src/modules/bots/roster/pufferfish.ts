import type { Animal } from "./types";

export const PUFFERFISH: Animal = {
	emoji: "🐡",
	tint: "#c9a227",
	definition: {
		id: "pufferfish",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 40 },
		weights: {},
	},
};
