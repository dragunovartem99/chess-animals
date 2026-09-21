import type { Animal } from "./types";

export const LOBSTER: Animal = {
	emoji: "🦞",
	tint: "#c0392b",
	definition: {
		id: "lobster",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 35 },
		weights: {},
	},
};
