import type { Animal } from "./types";

export const GOBLIN: Animal = {
	emoji: "👺",
	tint: "#b33a3a",
	definition: {
		id: "goblin",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 45 },
		weights: {},
	},
};
