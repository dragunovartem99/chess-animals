import type { Animal } from "./types";

export const DINOSAUR: Animal = {
	emoji: "🦖",
	tint: "#4f8a3c",
	definition: {
		id: "dinosaur",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 1, temperature: 0 },
		weights: {},
	},
};
