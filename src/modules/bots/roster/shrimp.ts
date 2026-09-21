import type { Animal } from "./types";

export const SHRIMP: Animal = {
	emoji: "🦐",
	tint: "#e07a5f",
	definition: {
		id: "shrimp",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 20 },
		weights: {},
	},
};
