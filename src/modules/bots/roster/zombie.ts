import type { Animal } from "./types";

export const ZOMBIE: Animal = {
	emoji: "🧟",
	tint: "#6b8f4e",
	definition: {
		id: "zombie",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 60 },
		weights: {},
	},
};
