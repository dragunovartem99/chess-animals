import type { Animal } from "./types";

export const TROLL: Animal = {
	emoji: "🧌",
	tint: "#7d6b57",
	definition: {
		id: "troll",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 35 },
		weights: {},
	},
};
