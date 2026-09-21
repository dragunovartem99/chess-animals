import type { Animal } from "./types";

export const WHALE: Animal = {
	emoji: "🐋",
	tint: "#4a6fa5",
	definition: {
		id: "whale",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 1, temperature: 0 },
		weights: {},
	},
};
