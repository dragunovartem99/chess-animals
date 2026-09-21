import type { Animal } from "./types";

export const VAMPIRE: Animal = {
	emoji: "🧛",
	tint: "#8b1e3f",
	definition: {
		id: "vampire",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 25 },
		weights: {},
	},
};
