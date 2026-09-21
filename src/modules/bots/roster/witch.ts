import type { Animal } from "./types";

export const WITCH: Animal = {
	emoji: "🧙‍♀️",
	tint: "#6a8f3a",
	definition: {
		id: "witch",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 70 },
		weights: {},
	},
};
