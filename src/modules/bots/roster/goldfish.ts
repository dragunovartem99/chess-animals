import type { Animal } from "./types";

// Stockfish undiluted, on ten times the budget of the rest: the ceiling the others are measured
// against.
export const GOLDFISH: Animal = {
	emoji: "🐠",
	tint: "#e0a030",
	definition: {
		id: "goldfish",
		search: { depth: 1 },
		stockfish: { nodes: 50000, lines: 1, temperature: 0 },
		weights: {},
	},
};
