import type { Animal } from "./types";

// Stockfish undiluted, on ten times the budget of the rest: the ceiling the others are measured
// against.
export const DRAGON: Animal = {
	emoji: "🐉",
	tint: "#c0392b",
	definition: {
		id: "dragon",
		search: { depth: 1 },
		stockfish: { nodes: 50000, lines: 1, temperature: 0 },
		weights: {},
	},
};
