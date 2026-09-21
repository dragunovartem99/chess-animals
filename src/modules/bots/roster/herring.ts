import type { Animal } from "./types";

export const HERRING: Animal = {
	emoji: "🐟",
	tint: "#8fb8cf",
	definition: {
		id: "herring",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 60 },
		weights: {},
	},
};
