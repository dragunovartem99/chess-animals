import type { Animal } from "./types";

export const GENIE: Animal = {
	emoji: "🧞",
	tint: "#3b7dd8",
	definition: {
		id: "genie",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 13 },
		weights: {},
	},
};
