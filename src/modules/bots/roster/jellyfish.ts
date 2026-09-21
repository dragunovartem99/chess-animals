import type { Animal } from "./types";

export const JELLYFISH: Animal = {
	emoji: "🪼",
	tint: "#7fb8d9",
	definition: {
		id: "jellyfish",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 30 },
		weights: {},
	},
};
